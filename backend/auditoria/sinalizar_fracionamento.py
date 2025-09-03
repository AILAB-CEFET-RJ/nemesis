"""
Script de detecção de fracionamento de empenhos em grupos
usando distâncias pré-computadas (tabela empenho_distancias).

Versão corrigida:
- Consulta de distâncias por jurisdicionado (idunid)
- Paralelização por grupo (joblib)
- Uso de itertuples / add_nodes_from em vez de iterrows
- cluster_id_global atribuído corretamente (1 por cluster)
- Salva clusters no Parquet e também no Postgres
"""

import os
import time
import argparse
import pandas as pd
import networkx as nx
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from tqdm import tqdm
from datetime import datetime
from joblib import Parallel, delayed

# ==============================
# Parser de argumentos
# ==============================
parser = argparse.ArgumentParser(description="Detecção de fracionamento de empenhos (usando distâncias pré-computadas)")
parser.add_argument("--valor_limiar", type=float, default=8000,
                    help="Limite de valor para considerar empenho suspeito")
parser.add_argument("--janela_dias", type=int, default=60,
                    help="Janela temporal em dias para detecção de fracionamento")
parser.add_argument("--ano", type=int, default=2018,
                    help="Ano de análise dos empenhos")
parser.add_argument("--sim_limiar", type=float, default=0.85,
                    help="Limiar de similaridade entre embeddings")
parser.add_argument("--min_cluster", type=int, default=3,
                    help="Número mínimo de empenhos para formar um cluster suspeito")
parser.add_argument("--data_inicio", type=str, default=None,
                    help="Data inicial no formato YYYY-MM-DD (default: 01-01 do ano)")
parser.add_argument("--data_fim", type=str, default=None,
                    help="Data final no formato YYYY-MM-DD (default: 12-31 do ano)")
parser.add_argument("--debug", action="store_true",
                    help="Ativa saída detalhada de debug")
parser.add_argument("--saida", type=str, default="suspeitas_fracionamento.parquet",
                    help="Nome do arquivo Parquet de saída")
parser.add_argument("--n_jobs", type=int, default=-1,
                    help="Número de núcleos para paralelização (default: -1 usa todos)")
args = parser.parse_args()

# ==============================
# Configura datas de início e fim
# ==============================
if args.data_inicio:
    data_inicio = datetime.strptime(args.data_inicio, "%Y-%m-%d")
else:
    data_inicio = datetime(args.ano, 1, 1)

if args.data_fim:
    data_fim = datetime.strptime(args.data_fim, "%Y-%m-%d")
else:
    data_fim = datetime(args.ano, 12, 31)

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
# Consulta aos empenhos
# ==============================
print("[INFO] Consultando empenhos...")

query = text("""
    SELECT e.idempenho, e.ente, e.idunid, e.elemdespesatce, e.vlr_empenhado,
           e.dtempenho, e.historico, e.credor
    FROM empenhos e
    WHERE e.vlr_empenhado <= :limite
      AND e.ano = :ano
      AND e.dtempenho BETWEEN :data_inicio AND :data_fim
    ORDER BY e.ente, e.idunid, e.elemdespesatce, e.dtempenho
""")

with engine.connect() as conn:
    df = pd.read_sql(query, conn, params={
        "limite": float(args.valor_limiar),
        "ano": int(args.ano),
        "data_inicio": data_inicio,
        "data_fim": data_fim,
    })

print(f"[INFO] Total de empenhos carregados para {args.ano}: {len(df)}")

# ==============================
# Função para processar grupo
# ==============================
def processar_grupo(ente, idunid, elem, grupo, dist_jur):
    clusters = []

    # filtra distâncias do grupo (já restritas ao jurisdicionado)
    dist_grupo = dist_jur[dist_jur["elemdespesatce"] == elem]
    if dist_grupo.empty:
        return []

    # monta grafo
    G = nx.Graph()
    G.add_nodes_from(
        (row.idempenho, {
            "vlr_empenhado": row.vlr_empenhado,
            "dtempenho": row.dtempenho,
            "historico": row.historico,
            "credor": row.credor
        })
        for row in grupo.itertuples()
    )

    valid_ids = set(grupo["idempenho"])
    for row in dist_grupo.itertuples():
        if row.idempenho_1 in valid_ids and row.idempenho_2 in valid_ids:
            G.add_edge(row.idempenho_1, row.idempenho_2, weight=row.similaridade)

    # clusters = componentes conexos
    for comp in nx.connected_components(G):
        if len(comp) >= args.min_cluster:
            soma_cluster = sum(G.nodes[idx]["vlr_empenhado"] for idx in comp)
            if soma_cluster <= args.valor_limiar:
                continue

            sims = [G[u][v]["weight"] for u, v in nx.edges(G.subgraph(comp))]
            min_sim, max_sim = (float(min(sims)), float(max(sims))) if sims else (None, None)

            cluster_items = []
            for idempenho in comp:
                item = G.nodes[idempenho]
                cluster_items.append({
                    "cluster_size": len(comp),
                    "soma_cluster": soma_cluster,
                    "min_sim": min_sim,
                    "max_sim": max_sim,
                    "ano": args.ano,
                    "ente": ente,
                    "idunid": idunid,
                    "elemdespesatce": elem,
                    "credor": item["credor"],
                    "idempenho": idempenho,
                    "data": item["dtempenho"],
                    "valor": item["vlr_empenhado"],
                    "historico": item["historico"],
                })
            clusters.append(cluster_items)

    return clusters

# ==============================
# Processamento por jurisdicionado
# ==============================
print("[INFO] Processando por jurisdicionado...")

suspeitas_expandidas = []
cluster_id_global = 0

with engine.connect() as conn:
    for (ente, idunid), df_jur in tqdm(df.groupby(["ente", "idunid"], sort=False), desc="Jurisdicionados"):
        # carrega distâncias só deste jurisdicionado
        dist_jur = pd.read_sql(text("""
            SELECT d.elemdespesatce, d.idempenho_1, d.idempenho_2, d.similaridade
            FROM empenho_distancias d
            WHERE d.ano = :ano
              AND d.similaridade >= :sim
              AND d.ente = :ente
              AND d.idunid = :idunid
        """), conn, params={
            "ano": int(args.ano),
            "sim": float(args.sim_limiar),
            "ente": ente,
            "idunid": int(idunid),
        })

        if dist_jur.empty:
            continue

        # processa os grupos (por elemento) em paralelo
        resultados = Parallel(n_jobs=args.n_jobs, prefer="threads")(
            delayed(processar_grupo)(ente, int(idunid), str(elem), grupo, dist_jur)
            for elem, grupo in df_jur.groupby("elemdespesatce", sort=False)
        )

        # consolida resultados do jurisdicionado
        for clusters in resultados:          # cada resultado é lista de clusters
            for cluster_items in clusters:   # cada cluster tem vários empenhos
                cluster_id_global += 1
                for item in cluster_items:
                    item["cluster_id"] = cluster_id_global
                    suspeitas_expandidas.append(item)

# ==============================
# Salva resultado
# ==============================
saida_final = args.saida.replace(".parquet", f"_{args.ano}.parquet")

print(f"[INFO] Salvando resultados em Parquet: {saida_final}")
df_suspeitas = pd.DataFrame(suspeitas_expandidas)
df_suspeitas.to_parquet(saida_final, index=False)

print(f"[INFO] Clusters suspeitos encontrados: {cluster_id_global}")
print(f"[INFO] Linhas exportadas no Parquet: {len(df_suspeitas)}")

# ==============================
# Salva também no banco
# ==============================
if not df_suspeitas.empty:
    print("[INFO] Gravando clusters no banco de dados...")
    df_suspeitas.to_sql(
        "clusters_fracionamento",
        engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=5000
    )
    print(f"[INFO] {len(df_suspeitas)} linhas inseridas na tabela clusters_fracionamento")
else:
    print("[INFO] Nenhum cluster encontrado, nada a gravar no banco.")

print(f"[INFO] Tempo total de execução: {time.time() - start_time:.2f} segundos")
