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
parser.add_argument("--janela_dias", type=int, default=None,
                    help="Janela temporal máxima em dias. Se omitida, compara todos os pares do grupo")
parser.add_argument("--debug", action="store_true",
                    help="Ativa saída de debug (mostra grupos pulados)")
parser.add_argument("--skip_backfill_ids", action="store_true",
                    help="Não preenche id_empenho_1/id_empenho_2 em linhas antigas antes do processamento")
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
# Validação do schema atual
# ==============================
def validar_schema():
    required_tables = {"empenhos", "empenho_embeddings", "empenho_distancias"}
    required_dist_columns = {
        "ente",
        "idunid",
        "ano",
        "elemdespesatce",
        "idempenho_1",
        "idempenho_2",
        "similaridade",
        "id_empenho_1",
        "id_empenho_2",
    }
    required_embedding_columns = {"id_empenho", "embedding_array"}

    with engine.begin() as conn:
        tables = {
            row[0]
            for row in conn.execute(
                text("""
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                      AND table_name = ANY(:tables)
                """),
                {"tables": list(required_tables)},
            )
        }
        missing_tables = sorted(required_tables - tables)
        if missing_tables:
            raise RuntimeError(
                "Tabelas ausentes no schema public: "
                f"{missing_tables}. Aplique sql/schema_dump.sql antes de gerar distâncias."
            )

        dist_columns = {
            row[0]
            for row in conn.execute(
                text("""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'empenho_distancias'
                """)
            )
        }
        missing_dist_columns = sorted(required_dist_columns - dist_columns)
        if missing_dist_columns:
            raise RuntimeError(f"Colunas ausentes em public.empenho_distancias: {missing_dist_columns}")

        embedding_columns = {
            row[0]
            for row in conn.execute(
                text("""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'empenho_embeddings'
                """)
            )
        }
        missing_embedding_columns = sorted(required_embedding_columns - embedding_columns)
        if missing_embedding_columns:
            raise RuntimeError(f"Colunas ausentes em public.empenho_embeddings: {missing_embedding_columns}")


# ==============================
# Backfill para linhas antigas
# ==============================
def backfill_ids_existentes():
    with engine.begin() as conn:
        result_1 = conn.execute(
            text("""
                UPDATE public.empenho_distancias d
                SET id_empenho_1 = e.id
                FROM public.empenhos e
                WHERE d.id_empenho_1 IS NULL
                  AND d.idempenho_1 = e.idempenho
            """)
        )
        result_2 = conn.execute(
            text("""
                UPDATE public.empenho_distancias d
                SET id_empenho_2 = e.id
                FROM public.empenhos e
                WHERE d.id_empenho_2 IS NULL
                  AND d.idempenho_2 = e.idempenho
            """)
        )

    print(f"[INFO] Backfill id_empenho_1: {result_1.rowcount} linhas atualizadas")
    print(f"[INFO] Backfill id_empenho_2: {result_2.rowcount} linhas atualizadas")


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
def gerar_pares_em_blocos(X, block_size):
    n = X.shape[0]
    for i in range(0, n, block_size):
        sims = cosine_similarity(X[i:i+block_size], X)
        for ii in range(sims.shape[0]):
            for j in range(n):
                if (i+ii) < j:  # metade superior da matriz
                    yield i+ii, j, sims[ii, j]


# ==============================
# Função para calcular similaridade com janela temporal
# ==============================
def gerar_pares_com_janela(X, datas, janela_dias):
    n = X.shape[0]
    for i in range(n):
        for j in range(i + 1, n):
            delta = (datas[j] - datas[i]).days
            if delta > janela_dias:
                break

            sim = cosine_similarity(X[i:i + 1], X[j:j + 1])[0][0]
            yield i, j, sim


# ==============================
# Função para inserir registros em lote
# ==============================
def inserir_registros(registros):
    if not registros:
        return

    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO public.empenho_distancias (
                    ente,
                    idunid,
                    ano,
                    elemdespesatce,
                    idempenho_1,
                    idempenho_2,
                    similaridade,
                    id_empenho_1,
                    id_empenho_2
                )
                VALUES (
                    :ente,
                    :idunid,
                    :ano,
                    :elemdespesatce,
                    :idempenho_1,
                    :idempenho_2,
                    :similaridade,
                    :id_empenho_1,
                    :id_empenho_2
                )
                ON CONFLICT (ente, idunid, ano, elemdespesatce, idempenho_1, idempenho_2)
                DO UPDATE SET
                    similaridade = EXCLUDED.similaridade,
                    id_empenho_1 = EXCLUDED.id_empenho_1,
                    id_empenho_2 = EXCLUDED.id_empenho_2
            """),
            registros,
        )


# ==============================
# Função para processar um grupo
# ==============================
def processar_grupo(ano, ente, idunid, elem):
    query = text("""
        SELECT
            e.id AS id_empenho,
            e.idempenho,
            e.dtempenho,
            emb.embedding_array
        FROM public.empenhos e
        JOIN public.empenho_embeddings emb ON emb.id_empenho = e.id
        WHERE e.ano = :ano
          AND e.ente = :ente
          AND e.idunid = :idunid
          AND e.elemdespesatce = :elem
          AND emb.embedding_array IS NOT NULL
        ORDER BY e.dtempenho NULLS LAST, e.id
    """)
    with engine.connect() as conn:
        df = pd.read_sql(query, conn,
                         params={"ano": ano, "ente": ente,
                                 "idunid": int(idunid), "elem": elem})

    if df.empty or len(df) < 2:
        return 0

    if args.limite_grupo and len(df) > args.limite_grupo:
        df = df.sample(args.limite_grupo, random_state=42)

    datas = None
    if args.janela_dias is not None:
        df["dtempenho"] = pd.to_datetime(df["dtempenho"], errors="coerce")
        before = len(df)
        df = df.dropna(subset=["dtempenho"]).sort_values(["dtempenho", "id_empenho"])
        if args.debug and len(df) != before:
            print(
                f"[DEBUG] {before - len(df)} empenhos sem dtempenho ignorados "
                f"no grupo {ano}-{ente}-{idunid}-{elem}"
            )
        if len(df) < 2:
            return 0
        datas = df["dtempenho"].tolist()

    # converte para float32 para economizar RAM
    X = np.stack(df["embedding_array"].apply(lambda x: np.array(x, dtype=np.float32)))
    ids = df["idempenho"].tolist()
    id_empenhos = df["id_empenho"].astype(int).tolist()

    if args.janela_dias is None:
        pares = gerar_pares_em_blocos(X, args.block_size)
    else:
        pares = gerar_pares_com_janela(X, datas, args.janela_dias)

    registros = []
    for i, j, sim in pares:
        registros.append({
            "ano": ano,
            "ente": ente,
            "idunid": int(idunid),
            "elemdespesatce": elem,
            "idempenho_1": ids[i],
            "idempenho_2": ids[j],
            "similaridade": float(sim),
            "id_empenho_1": id_empenhos[i],
            "id_empenho_2": id_empenhos[j],
        })

        # grava em lote no banco
        if len(registros) >= args.batch_size:
            inserir_registros(registros)
            registros = []

    # flush final
    inserir_registros(registros)

    return len(df)


validar_schema()
if not args.skip_backfill_ids:
    backfill_ids_existentes()

# ==============================
# Loop pelos anos
# ==============================
for ano in args.anos:
    print(f"\n[INFO] ===== Iniciando processamento do ano {ano} =====")

    # descobrir grupos existentes no ano
    query_grupos = text("""
        SELECT DISTINCT e.ente, e.idunid, e.elemdespesatce
        FROM public.empenhos e
        JOIN public.empenho_embeddings emb ON emb.id_empenho = e.id
        WHERE e.ano = :ano
          AND emb.embedding_array IS NOT NULL
        ORDER BY e.ente, e.idunid, e.elemdespesatce
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
