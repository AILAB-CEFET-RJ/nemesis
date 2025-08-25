"""
Script para pré-computar distâncias entre empenhos
(agrupados por ente, idunid, ano, elemdespesatce) e salvar no banco.

Uso:
python precompute_distancias.py --ano 2018 --janela_dias 60
"""

import os
import argparse
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
from tqdm import tqdm

# ==============================
# Parser de argumentos
# ==============================
parser = argparse.ArgumentParser(description="Pré-computar distâncias entre empenhos")
parser.add_argument("--ano", type=int, required=True, help="Ano de análise")
parser.add_argument("--janela_dias", type=int, default=60, help="Janela temporal em dias")
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

# ==============================
# Criação da tabela (se não existir)
# ==============================
with engine.begin() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS empenho_distancias (
            ente VARCHAR NOT NULL,
            idunid VARCHAR NOT NULL,
            ano INT NOT NULL,
            elemdespesatce VARCHAR NOT NULL,
            idempenho_1 VARCHAR NOT NULL,
            idempenho_2 VARCHAR NOT NULL,
            similaridade FLOAT NOT NULL,
            PRIMARY KEY (ente, idunid, ano, elemdespesatce, idempenho_1, idempenho_2)
        )
    """))

# ==============================
# Identificar combinações (ente, idunid, ano, elem)
# ==============================
print(f"[INFO] Identificando grupos de (ente, idunid, ano, elemdespesatce) para ano {args.ano}...")

query_grupos = text("""
    SELECT DISTINCT ente, idunid, ano, elemdespesatce
    FROM empenhos_por_ano
    WHERE ano = :ano
    ORDER BY ente, idunid, elemdespesatce
""")

with engine.connect() as conn:
    grupos = conn.execute(query_grupos, {"ano": args.ano}).fetchall()

print(f"[INFO] Total de grupos encontrados: {len(grupos)}")

# ==============================
# Processamento grupo a grupo
# ==============================
for (ente, idunid, ano, elem) in tqdm(grupos, desc="Grupos processados"):
    # Carrega somente os empenhos deste grupo
    query_empenhos = text("""
        SELECT idempenho, dtempenho, embedding_array AS embedding
        FROM empenhos_por_ano
        WHERE ente = :ente AND idunid = :idunid AND ano = :ano AND elemdespesatce = :elem
        ORDER BY dtempenho
    """)

    with engine.connect() as conn:
        df = pd.read_sql(query_empenhos, conn, params={"ente": ente, "idunid": idunid, "ano": ano, "elem": elem})

    if df.empty or len(df) == 1:
        continue  # nada a comparar

    # Converte
    df["dtempenho"] = pd.to_datetime(df["dtempenho"])
    df["embedding"] = df["embedding"].apply(lambda x: np.array(x, dtype=np.float32))

    registros = df.to_dict("records")
    rows_to_insert = []

    # Comparação par a par com janela temporal
    n = len(registros)
    for i in range(n):
        dt_i = registros[i]["dtempenho"]
        for j in range(i + 1, n):
            dt_j = registros[j]["dtempenho"]

            if (dt_j - dt_i).days > args.janela_dias:
                break  # já que está ordenado por data

            emb_i = registros[i]["embedding"].reshape(1, -1)
            emb_j = registros[j]["embedding"].reshape(1, -1)
            sim = cosine_similarity(emb_i, emb_j)[0][0]

            rows_to_insert.append({
                "ente": ente,
                "idunid": idunid,
                "ano": ano,
                "elemdespesatce": elem,
                "idempenho_1": registros[i]["idempenho"],
                "idempenho_2": registros[j]["idempenho"],
                "similaridade": float(sim)
            })

    # Inserção no banco (logo após processar o grupo)
    if rows_to_insert:
        with engine.begin() as conn:
            conn.execute(
                text("""
                    INSERT INTO empenho_distancias 
                    (ente, idunid, ano, elemdespesatce, idempenho_1, idempenho_2, similaridade)
                    VALUES (:ente, :idunid, :ano, :elemdespesatce, :idempenho_1, :idempenho_2, :similaridade)
                    ON CONFLICT DO NOTHING
                """),
                rows_to_insert
            )

print("[INFO] Pré-computação concluída com sucesso.")
