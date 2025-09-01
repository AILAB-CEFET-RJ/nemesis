"""
Script para gerar distâncias entre empenhos de múltiplos anos
e salvar na tabela empenho_distancias, processando grupo a grupo
(ente, idunid, elemdespesatce).

Versão segura:
- Usa checkpoint automático (pula grupos já processados).
- Calcula similaridade em blocos (chunked cosine similarity).
- Insere pares no banco em batches (default 100k).
"""

import os
import argparse
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
from tqdm import tqdm

# ==============================
# Parser de argumentos
# ==============================
parser = argparse.ArgumentParser(description="Geração de distâncias entre empenhos (anos múltiplos)")
parser.add_argument("--anos", type=int, nargs="+", required=True,
                    help="Lista de anos a processar (ex.: 2019 2020 2021)")
parser.add_argument("--limite_grupo", type=int, default=None,
                    help="Número máximo de empenhos por grupo para debug/teste")
parser.add_argument("--batch_size", type=int, default=100000,
                    help="Número de pares por inserção no banco")
parser.add_argument("--block_size", type=int, default=500,
                    help="Tamanho dos blocos para cálculo de similaridade")
parser.add_argument("--debug", action="store_true",
                    help="Ativa saída de debug (mostra grupos pulados)")
args = parser.parse_args()

# ==============================
# Configuração do banco
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
# Função para verificar se grupo já foi processado
# ==============================
def grupo_ja_processado(ano, ente, idunid, elem):
    query = text("""
        SELECT 1
        FROM empenho_distancias d
        WHERE d.ano = :ano
          AND d.ente = :ente
          AND d.idunid = :idunid
          AND d.elemdespesatce = :elem
        LIMIT 1
    """)
    with engine.connect() as conn:
        res = conn.execute(query, {
            "ano": ano,
            "ente": ente,
            "idunid": int(idunid),
            "elem": elem
        }).fetchone()
    return res is not None

# ==============================
# Função para calcular similaridade em blocos
# ==============================
def gerar_pares_em_blocos(X, ids, block_size):
    n = X.shape[0]
    for i in range(0, n, block_size):
        sims = cosine_similarity(X[i:i+block_size], X)
        for ii in range(sims.shape[0]):
            for j in range(n):
                if (i+ii) < j:  # metade superior da matriz
                    yield i+ii, j, sims[ii, j]

# ==============================
# Função para processar um grupo
# ==============================
def processar_grupo(ano, ente, idunid, elem):
    query = text("""
        SELECT e.idempenho, emb.embedding_array
        FROM empenhos e
        JOIN empenho_embeddings emb ON e.idempenho = emb.idempenho
        WHERE e.ano = :ano
          AND e.ente = :ente
          AND e.idunid = :idunid
          AND e.elemdespesatce = :elem
    """)
    with engine.connect() as conn:
        df = pd.read_sql(query, conn,
                         params={"ano": ano, "ente": ente,
                                 "idunid": int(idunid), "elem": elem})

    if df.empty or len(df) < 2:
        return 0

    if args.limite_grupo and len(df) > args.limite_grupo:
        df = df.sample(args.limite_grupo, random_state=42)

    # converte para float32 para economizar RAM
    X = np.stack(df["embedding_array"].apply(lambda x: np.array(x, dtype=np.float32)))
    ids = df["idempenho"].tolist()

    registros = []
    for i, j, sim in gerar_pares_em_blocos(X, ids, args.block_size):
        registros.append({
            "ano": ano,
            "ente": ente,
            "idunid": int(idunid),
            "elemdespesatce": elem,
            "idempenho_1": ids[i],
            "idempenho_2": ids[j],
            "similaridade": float(sim)
        })

        # grava em lote no banco
        if len(registros) >= args.batch_size:
            pd.DataFrame(registros).to_sql("empenho_distancias", engine,
                                           if_exists="append", index=False)
            registros = []

    # flush final
    if registros:
        pd.DataFrame(registros).to_sql("empenho_distancias", engine,
                                       if_exists="append", index=False)

    return len(df)

# ==============================
# Loop pelos anos
# ==============================
for ano in args.anos:
    print(f"\n[INFO] ===== Iniciando processamento do ano {ano} =====")

    # descobrir grupos existentes no ano
    query_grupos = text("""
        SELECT DISTINCT e.ente, e.idunid, e.elemdespesatce
        FROM empenhos e
        JOIN empenho_embeddings emb ON e.idempenho = emb.idempenho
        WHERE e.ano = :ano
    """)
    with engine.connect() as conn:
        grupos = pd.read_sql(query_grupos, conn, params={"ano": ano})

    print(f"[INFO] {len(grupos)} grupos encontrados para {ano}")

    for row in tqdm(grupos.itertuples(), total=len(grupos), desc=f"Processando {ano}"):
        if grupo_ja_processado(ano, row.ente, row.idunid, row.elemdespesatce):
            if args.debug:
                print(f"[DEBUG] Pulando grupo já processado: {row.ente}-{row.idunid}-{row.elemdespesatce}")
            continue

        n = processar_grupo(ano, row.ente, row.idunid, row.elemdespesatce)
        if n > 0:
            print(f"[INFO] {ano} - {row.ente}-{row.idunid}-{row.elemdespesatce}: {n} empenhos processados")
