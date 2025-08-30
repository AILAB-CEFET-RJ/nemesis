"""
Script de detecção de clusters de empenhos relacionados à folha de pagamento,
usando distâncias pré-computadas da tabela 'empenho_distancias'.

Processamento otimizado: grupo a grupo por (ente, idunid, elem, ano).

Exemplo de uso:
python detectar_folha.py --ano 2018 --saida suspeitas_folha.parquet --limite_grupos 10 --debug
"""

import os
import re
import time
import argparse
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from tqdm import tqdm
from sklearn.cluster import DBSCAN

# ==============================
# Parser de argumentos
# ==============================
parser = argparse.ArgumentParser(description="Detecção de clusters de folha de pagamento (distâncias pré-computadas)")
parser.add_argument("--ano", type=int, required=True, help="Ano de análise dos empenhos")
parser.add_argument("--sim_limiar", type=float, default=0.9, help="Limiar de similaridade média para considerar cluster suspeito")
parser.add_argument("--min_cluster", type=int, default=5, help="Número mínimo de empenhos para formar cluster candidato")
parser.add_argument("--saida", type=str, default="suspeitas_folha.parquet", help="Arquivo de saída detalhada")
parser.add_argument("--saida_resumo", type=str, default="resumo_clusters_folha.parquet", help="Arquivo de saída resumida por cluster")
parser.add_argument("--limite_grupos", type=int, default=None, help="Número máximo de grupos a processar (para testes)")
parser.add_argument("--debug", action="store_true", help="Ativa saída detalhada de debug")
args = parser.parse_args()

# ==============================
# Configurações do banco
# ==============================
load_dotenv()
DB_USER = os.getenv("POSTGRES_USER")
DB_PASS = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST")
DB_PORT = os.getenv("POSTGRES_PORT")
DB_NAME = os.getenv("POSTGRES_DB")

engine = create_engine(
    f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

start_time = time.time()
print("[INFO] Script iniciado.")

# ==============================
# Funções auxiliares
# ==============================
def tipo_credor(credor: str) -> str:
    if re.fullmatch(r"\d{11}", credor): return "CPF"
    elif re.fullmatch(r"\d{14}", credor): return "CNPJ"
    elif re.search(r"\d{3}\.\d{3}\.\d{3}-\d{2}", credor): return "CPF"
    elif re.search(r"\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}", credor): return "CNPJ"
    return "Outro"

def entropia(series: pd.Series) -> float:
    counts = series.value_counts(normalize=True)
    return -np.sum(counts * np.log2(counts + 1e-9))

PALAVRAS_CHAVE = [
    "FOLHA", "SALARIO", "GPS", "INSS", "FGTS",
    "REMUNERACAO", "PESSOAL", "SERVIDOR",
    "13", "PROVENTOS", "VERBA"
]

def contem_palavra_chave(texto: str) -> bool:
    return any(p in texto.upper() for p in PALAVRAS_CHAVE)

def salvar_incremental(df: pd.DataFrame, path: str):
    """Salva DataFrame em Parquet, criando arquivo se não existir e usando append se já existir"""
    if df.empty:
        return
    if os.path.exists(path):
        df.to_parquet(path, index=False, engine="fastparquet", append=True)
    else:
        df.to_parquet(path, index=False, engine="fastparquet")

# ==============================
# Buscar todas as combinações
# ==============================
print(f"[INFO] Buscando chaves de grupos para o ano {args.ano}...")
query_keys = text("""
    SELECT DISTINCT ente, idunid, elemdespesatce, ano
    FROM empenho_distancias
    WHERE ano = :ano
""")

with engine.connect() as conn:
    keys = conn.execute(query_keys, {"ano": args.ano}).fetchall()

if args.limite_grupos:
    keys = keys[:args.limite_grupos]
    print(f"[INFO] Rodando em modo teste: processando apenas {len(keys)} grupos.")

print(f"[INFO] Total de grupos a processar: {len(keys)}")

# ==============================
# Processar grupo a grupo
# ==============================
cluster_id = 0
suspeitas = []
resumo_clusters = []

# estatísticas globais de similaridades fora do intervalo
global_out_of_bounds = 0
global_max_sim = -np.inf
global_min_sim = np.inf
grupos_com_erro = 0
valores_out_of_bounds = []   # lista global de valores anômalos

with engine.connect() as conn:
    for ente, idunid, elem, ano in tqdm(keys, desc="Grupos processados"):
        # 1. Buscar distâncias do grupo
        query_dist = text("""
            SELECT idempenho_1, idempenho_2, similaridade
            FROM empenho_distancias
            WHERE ano = :ano AND ente = :ente AND idunid = :idunid AND elemdespesatce = :elem
        """)
        dist_df = pd.read_sql(query_dist, conn, params={
            "ano": ano, "ente": ente, "idunid": idunid, "elem": elem
        })
        if dist_df.empty:
            continue

        # 2. Empenhos únicos
        empenhos = pd.unique(dist_df[["idempenho_1", "idempenho_2"]].values.ravel())
        if len(empenhos) < args.min_cluster:
            continue

        # 3. Metadados do grupo
        query_meta = text("""
            SELECT idempenho, vlr_empenhado, dtempenho, historico, credor
            FROM empenhos_por_ano
            WHERE ano = :ano AND ente = :ente AND idunid = :idunid AND elemdespesatce = :elem
              AND idempenho = ANY(:ids)
        """)
        meta_df = pd.read_sql(query_meta, conn, params={
            "ano": ano, "ente": ente, "idunid": idunid, "elem": elem, "ids": list(empenhos)
        })
        if meta_df.empty:
            continue

        meta_df["dtempenho"] = pd.to_datetime(meta_df["dtempenho"])
        meta_df["tipo_credor"] = meta_df["credor"].apply(tipo_credor)
        meta_df["tem_palavra_chave"] = meta_df["historico"].apply(contem_palavra_chave)
        meta_df = meta_df.set_index("idempenho")

        # 4. Montar matriz de distâncias
        idx_map = {emp: i for i, emp in enumerate(empenhos)}
        n = len(empenhos)
        dist_matrix = np.ones((n, n), dtype=np.float32)
        np.fill_diagonal(dist_matrix, 0.0)

        out_of_bounds = 0
        for _, row in dist_df.iterrows():
            i, j = idx_map[row["idempenho_1"]], idx_map[row["idempenho_2"]]
            sim = row["similaridade"]

            # atualizar estatísticas globais
            if sim > global_max_sim: global_max_sim = sim
            if sim < global_min_sim: global_min_sim = sim

            if sim < 0 or sim > 1:
                out_of_bounds += 1
                global_out_of_bounds += 1
                valores_out_of_bounds.append(sim)   # salvar valor anômalo

            sim = min(max(sim, 0.0), 1.0)  # clamp para [0,1]
            d = 1 - sim
            dist_matrix[i, j] = d
            dist_matrix[j, i] = d

        if out_of_bounds > 0:
            grupos_com_erro += 1
            if args.debug:
                print(f"[DEBUG] {out_of_bounds} valores de similaridade fora de [0,1] no grupo ({ente}, {idunid}, {elem}, {ano})")

        # 5. Rodar DBSCAN
        db = DBSCAN(eps=(1 - args.sim_limiar), min_samples=args.min_cluster, metric="precomputed")
        labels = db.fit_predict(dist_matrix)

        meta_sub = meta_df.loc[empenhos].copy()
        meta_sub["cluster_label"] = labels

        for label in set(labels):
            if label == -1: 
                continue
            sub = meta_sub[meta_sub["cluster_label"] == label]
            if len(sub) < args.min_cluster:
                continue

            cluster_size = len(sub)
            n_credor = sub["credor"].nunique()
            tipos_credor = ",".join(sorted(sub["tipo_credor"].unique()))
            n_palavras_chave = sub["tem_palavra_chave"].sum()
            dias_distintos = sub["dtempenho"].dt.normalize().nunique()
            entropia_cred = entropia(sub["credor"])

            idxs = [idx_map[e] for e in sub.index]
            sim_vals = 1 - dist_matrix[np.ix_(idxs, idxs)]
            sim_medio = float(sim_vals.mean())

            # Score
            score = 0
            if sim_medio >= args.sim_limiar: score += 30
            if cluster_size >= 10: score += 20
            if n_credor > 3 and "CPF" in tipos_credor and "CNPJ" in tipos_credor: score += 15
            if n_palavras_chave > 0: score += 15
            if dias_distintos >= 2: score += 10
            if entropia_cred > 2: score += 10

            cluster_id += 1
            for idempenho, row in sub.iterrows():
                suspeitas.append({
                    "cluster_id": cluster_id,
                    "cluster_size": cluster_size,
                    "sim_medio": sim_medio,
                    "n_credor": n_credor,
                    "tipos_credor": tipos_credor,
                    "entropia_credor": entropia_cred,
                    "n_palavras_chave": int(n_palavras_chave),
                    "dias_distintos": int(dias_distintos),
                    "score": score,
                    "ente": ente,
                    "idunid": idunid,
                    "ano": ano,
                    "elemdespesatce": elem,
                    "credor": row["credor"],
                    "idempenho": idempenho,
                    "data": row["dtempenho"],
                    "valor": row["vlr_empenhado"],
                    "historico": row["historico"],
                })

            resumo_clusters.append({
                "cluster_id": cluster_id,
                "ente": ente,
                "idunid": idunid,
                "ano": ano,
                "elemdespesatce": elem,
                "cluster_size": cluster_size,
                "sim_medio": sim_medio,
                "n_credor": n_credor,
                "tipos_credor": tipos_credor,
                "entropia_credor": entropia_cred,
                "n_palavras_chave": int(n_palavras_chave),
                "dias_distintos": int(dias_distintos),
                "score": score,
            })

        # Salvar incrementalmente
        if len(suspeitas) > 2000:
            salvar_incremental(pd.DataFrame(suspeitas), args.saida)
            salvar_incremental(pd.DataFrame(resumo_clusters), args.saida_resumo)
            suspeitas, resumo_clusters = [], []

# ==============================
# Salvar resultados finais
# ==============================
salvar_incremental(pd.DataFrame(suspeitas), args.saida)
salvar_incremental(pd.DataFrame(resumo_clusters), args.saida_resumo)

# ==============================
# Estatísticas finais de qualidade
# ==============================
print(f"[INFO] Tempo total de execução: {time.time() - start_time:.2f} segundos")
if global_out_of_bounds > 0:
    print(f"[WARN] Similaridades fora de [0,1]: {global_out_of_bounds} valores em {grupos_com_erro} grupos.")
    print(f"[WARN] Valor mínimo encontrado: {global_min_sim:.4f}, máximo: {global_max_sim:.4f}")
    preview = valores_out_of_bounds[:20]
    print(f"[WARN] Exemplos de valores fora da faixa (máx 20): {preview}")
else:
    print("[INFO] Todas as similaridades estavam no intervalo [0,1].")
