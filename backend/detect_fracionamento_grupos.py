"""
Script de detecção de fracionamento de empenhos em grupos
com feedback ao usuário, parâmetros via linha de comando
e detecção de clusters como componentes conexos (networkx).

Exemplo de uso:

1. Padrão (ano todo de 2018)
python detect_fracionamento_grupos.py --ano 2018

2. Apenas de março a junho
python detect_fracionamento_grupos.py --ano 2018 --data_inicio 2018-03-01 --data_fim 2018-06-30
"""

import os
import time
import argparse
import numpy as np
import pandas as pd
import networkx as nx
from sqlalchemy import create_engine, text
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
from tqdm import tqdm
from datetime import datetime

# ==============================
# Parser de argumentos
# ==============================
parser = argparse.ArgumentParser(description="Detecção de fracionamento de empenhos")
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
print("[INFO] Consultando empenhos no banco...")

query = text("""
    SELECT e.idempenho, e.idunid, e.elemdespesatce, e.vlr_empenhado,
           e.dtempenho, e.historico,
           emb.embedding_array AS embedding
    FROM empenhos_por_ano e
    JOIN empenho_embeddings emb ON e.idempenho = emb.idempenho
    WHERE e.vlr_empenhado <= :limite
      AND e.ano = :ano
      AND e.dtempenho BETWEEN :data_inicio AND :data_fim
    ORDER BY e.idunid, e.elemdespesatce, e.dtempenho
""")

with engine.connect() as conn:
    df = pd.read_sql(
        query,
        conn,
        params={
            "limite": args.valor_limiar,
            "ano": args.ano,
            "data_inicio": data_inicio,
            "data_fim": data_fim,
        },
    )

print(f"[INFO] Total de empenhos carregados para {args.ano}: {len(df)}")

# Conversões
print("[INFO] Convertendo datas e embeddings...")
df["dtempenho"] = pd.to_datetime(df["dtempenho"])
df["embedding"] = df["embedding"].apply(lambda x: np.array(x, dtype=np.float32))

# ==============================
# Agrupamento → clusters via componentes conexos
# ==============================
print("[INFO] Iniciando agrupamento por (idunid, elemdespesatce)...")
suspeitas_expandidas = []
cluster_id = 0

grupos = df.groupby(["idunid", "elemdespesatce"], sort=False)

for (idunid, elem), grupo in tqdm(grupos, desc="Grupos processados"):
    registros = grupo.to_dict("records")
    G = nx.Graph()

    # Adiciona nós
    for idx, reg in enumerate(registros):
        G.add_node(idx, **reg)

    # Adiciona arestas (relações de fracionamento)
    for i in range(len(registros)):
        for j in range(i + 1, len(registros)):
            dt_i = registros[i]["dtempenho"]
            dt_j = registros[j]["dtempenho"]

            if (dt_j - dt_i).days > args.janela_dias:
                break  # já que está ordenado por data

            sim = cosine_similarity(
                registros[i]["embedding"].reshape(1, -1),
                registros[j]["embedding"].reshape(1, -1)
            )[0][0]

            if sim > args.sim_limiar:
                G.add_edge(i, j)

    # Cada componente conectado é um cluster
    for comp in nx.connected_components(G):
        if len(comp) >= args.min_cluster:
            cluster_id += 1
            cluster_size = len(comp)

            # calcula similaridades dentro do cluster
            nodes = list(comp)
            sims = []
            for a in range(len(nodes)):
                for b in range(a + 1, len(nodes)):
                    emb_a = G.nodes[nodes[a]]["embedding"].reshape(1, -1)
                    emb_b = G.nodes[nodes[b]]["embedding"].reshape(1, -1)
                    sims.append(cosine_similarity(emb_a, emb_b)[0][0])

            min_sim = float(np.min(sims)) if sims else None
            max_sim = float(np.max(sims)) if sims else None

            for idx in comp:
                item = G.nodes[idx]
                suspeitas_expandidas.append({
                    "cluster_id": cluster_id,
                    "cluster_size": cluster_size,
                    "min_sim": min_sim,
                    "max_sim": max_sim,
                    "idunid": idunid,
                    "elemdespesatce": elem,
                    "idempenho": item["idempenho"],
                    "data": item["dtempenho"],
                    "valor": item["vlr_empenhado"],
                    "historico": item["historico"],
                })

    if cluster_id % 100 == 0 and cluster_id > 0:
        print(f"[INFO] {cluster_id} clusters suspeitos identificados até agora...")

# ==============================
# Salva resultado
# ==============================
print("[INFO] Salvando resultados em CSV...")
df_suspeitas = pd.DataFrame(suspeitas_expandidas)
df_suspeitas.to_csv("suspeitas_fracionamento.csv", index=False)

print(f"[INFO] Clusters suspeitos encontrados: {cluster_id}")
print(f"[INFO] Linhas exportadas no CSV: {len(df_suspeitas)}")
print(f"[INFO] Tempo total de execução: {time.time() - start_time:.2f} segundos")