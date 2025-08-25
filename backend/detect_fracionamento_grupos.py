"""
Script de detecção de fracionamento de empenhos em grupos
usando distâncias pré-computadas (tabela empenho_distancias).

Exemplo de uso:

python detect_fracionamento_grupos.py --ano 2018
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
print("[INFO] Consultando empenhos e distâncias pré-computadas...")

query = text("""
    SELECT e.idempenho, e.ente, e.idunid, e.elemdespesatce, e.vlr_empenhado,
           e.dtempenho, e.historico, e.credor
    FROM empenhos_por_ano e
    WHERE e.vlr_empenhado <= :limite
      AND e.ano = :ano
      AND e.dtempenho BETWEEN :data_inicio AND :data_fim
    ORDER BY e.ente, e.idunid, e.elemdespesatce, e.dtempenho
""")

with engine.connect() as conn:
    df = pd.read_sql(query, conn, params={
        "limite": args.valor_limiar,
        "ano": args.ano,
        "data_inicio": data_inicio,
        "data_fim": data_fim,
    })

print(f"[INFO] Total de empenhos carregados para {args.ano}: {len(df)}")

# ==============================
# Agrupamento → clusters via componentes conexos
# ==============================
print("[INFO] Iniciando agrupamento por (ente, idunid, elemdespesatce)...")
suspeitas_expandidas = []
cluster_id = 0

grupos = df.groupby(["ente", "idunid", "elemdespesatce"], sort=False)
estatisticas_grupos = []

for (ente, idunid, elem), grupo in tqdm(grupos, desc="Grupos processados"):
    tam = len(grupo)
    if args.debug:
        print(f"[DEBUG] Grupo ente={ente}, idunid={idunid}, elem={elem}, tamanho={tam}")
    estatisticas_grupos.append((ente, idunid, elem, tam))

    # consulta pares pré-computados com similaridade acima do limiar
    query_dist = text("""
        SELECT d.idempenho_1, d.idempenho_2, d.similaridade
        FROM empenho_distancias d
        WHERE d.ente = :ente
          AND d.idunid = :idunid
          AND d.ano = :ano
          AND d.elemdespesatce = :elem
          AND d.similaridade >= :sim
    """)

    with engine.connect() as conn:
        distancias = pd.read_sql(query_dist, conn, params={
            "ente": ente,
            "idunid": idunid,
            "ano": args.ano,
            "elem": elem,
            "sim": args.sim_limiar,
        })

    if distancias.empty:
        continue

    # monta grafo com empenhos do grupo
    G = nx.Graph()
    for _, row in grupo.iterrows():
        G.add_node(row["idempenho"], **row.to_dict())
    for _, row in distancias.iterrows():
        G.add_edge(row["idempenho_1"], row["idempenho_2"], weight=row["similaridade"])

    # cada componente conectado = cluster
    for comp in nx.connected_components(G):
        if len(comp) >= args.min_cluster:
            cluster_size = len(comp)
            soma_cluster = sum(G.nodes[idx]["vlr_empenhado"] for idx in comp)

            if soma_cluster <= args.valor_limiar:
                continue

            cluster_id += 1

            sims = [G[u][v]["weight"] for u, v in nx.edges(G.subgraph(comp))]
            min_sim = float(min(sims)) if sims else None
            max_sim = float(max(sims)) if sims else None

            for idempenho in comp:
                item = G.nodes[idempenho]
                suspeitas_expandidas.append({
                    "cluster_id": cluster_id,
                    "cluster_size": cluster_size,
                    "soma_cluster": soma_cluster,
                    "min_sim": min_sim,
                    "max_sim": max_sim,
                    "ente": ente,
                    "idunid": idunid,
                    "elemdespesatce": elem,
                    "credor": item["credor"],
                    "idempenho": item["idempenho"],
                    "data": item["dtempenho"],
                    "valor": item["vlr_empenhado"],
                    "historico": item["historico"],
                })

    if cluster_id % 100 == 0 and cluster_id > 0:
        print(f"[INFO] {cluster_id} clusters suspeitos identificados até agora...")

# ==============================
# Resumo dos maiores grupos
# ==============================
print("\n[RESUMO] Top 10 maiores grupos por tamanho:")
estatisticas_grupos = sorted(estatisticas_grupos, key=lambda x: x[3], reverse=True)
for ente, idunid, elem, tam in estatisticas_grupos[:10]:
    print(f"  ente={ente}, idunid={idunid}, elem={elem}, tamanho={tam}")

# ==============================
# Salva resultado
# ==============================
print(f"[INFO] Salvando resultados em Parquet: {args.saida}")
df_suspeitas = pd.DataFrame(suspeitas_expandidas)
df_suspeitas.to_parquet(args.saida, index=False)

print(f"[INFO] Clusters suspeitos encontrados: {cluster_id}")
print(f"[INFO] Linhas exportadas no Parquet: {len(df_suspeitas)}")
print(f"[INFO] Tempo total de execução: {time.time() - start_time:.2f} segundos")
