import os
import time
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from psycopg2.extras import execute_batch
from dotenv import load_dotenv

# Carregar variáveis do .env
load_dotenv()

DB_USER = os.getenv("POSTGRES_USER")
DB_PASS = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "empenhos")

# 1. Ler arquivo parquet
print("Lendo arquivo parquet...")
df = pd.read_parquet("data/tce_large.parquet")

# Remover colunas auxiliares (como 'index', se existir)
if "index" in df.columns:
    df = df.drop(columns=["index"])

# Padronizar nomes das colunas para minúsculo
# Padronizar nomes das colunas para minúsculo
df.columns = [c.lower() for c in df.columns]

# Lista de colunas válidas no banco
expected_cols = {
    "idempenho", "ano", "vlr_anulacaoempenho", "cdfontetce", "cdfonteug",
    "cnpjraiz", "cpfcnpjcredorqtnrs", "cpfcnpjcredor", "credor", "dtempenho",
    "defontetce", "defonteug", "deprograma", "deprojativ", "dtanomes",
    "elemento", "elemdespesatce", "elemdespesaug", "ente", "esfera", "funcao",
    "historico", "idcontrato", "idfonte", "idfuncao", "id_orgao", "idprograma",
    "idsubfuncao", "idunid", "idorgao", "nrfonte", "nrfonteug", "nrlicitacao",
    "nrprojativ", "nrempenho", "progtrab", "progtrabred", "projativ", "subfuncao",
    "tp_empenho", "unidade", "vlr_empenho", "vlr_anul_liquidacao", "vlr_liquidacao",
    "vlr_pagto", "vlr_retencao", "vlr_subempenho", "vlr_empenhado", "vlr_liquidado",
    "vlr_pago", "cgelem", "cgprogtrab", "cgigual", "cod_elem", "cod_pt", "cg",
    "cgtitulo", "cgdesc", "cgtittce", "cgfreq", "cglevel", "cgpai", "cgroot", "cgchild"
}

# Garantir que apenas colunas esperadas serão mantidas
df = df[[c for c in df.columns if c in expected_cols]]

# Verificação extra: garantir que campos críticos estão presentes
critical = ["ente", "ano", "idunid", "nrempenho", "idfonte", "elemdespesatce"]
missing = [c for c in critical if c not in df.columns]
if missing:
    raise ValueError(f"Campos críticos ausentes no DataFrame: {missing}")

# 2. Remover duplicatas em idempenho
df = df.drop_duplicates(subset=["idempenho"], keep="first")

print(f"Linhas após remover duplicatas: {df.shape[0]}")
print(f"idempenho únicos: {df['idempenho'].nunique()}")

# 3. Conversão de tipos
print("Convertendo tipos...")

if "dtempenho" in df.columns:
    df["dtempenho"] = pd.to_datetime(df["dtempenho"], errors="coerce").dt.date

valores = [
    "vlr_anulacaoempenho", "vlr_empenho", "vlr_anul_liquidacao",
    "vlr_liquidacao", "vlr_pagto", "vlr_retencao", "vlr_subempenho",
    "vlr_empenhado", "vlr_liquidado", "vlr_pago", "cod_elem"
]
for col in valores:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors="coerce")

print("Conversão concluída")

# 4. Conectar ao PostgreSQL
engine: Engine = create_engine(
    f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# 5. Criar tabela com DDL em minúsculas
ddl = """
drop table if exists empenhos;

create table empenhos (
    idempenho            varchar primary key,
    ano                  integer,
    vlr_anulacaoempenho  numeric(18,2),
    cdfontetce           bigint,
    cdfonteug            bigint,
    cnpjraiz             varchar(8),
    cpfcnpjcredorqtnrs   smallint,
    cpfcnpjcredor        varchar(14),
    credor               text,
    dtempenho            date,
    defontetce           text,
    defonteug            text,
    deprograma           text,
    deprojativ           text,
    dtanomes             integer,
    elemento             bigint,
    elemdespesatce       text,
    elemdespesaug        text,
    ente                 text,
    esfera               text,
    funcao               text,
    historico            text,
    idcontrato           varchar,
    idfonte              bigint,
    idfuncao             bigint,
    id_orgao             numeric(20,0),
    idprograma           bigint,
    idsubfuncao          bigint,
    idunid               bigint,
    idorgao              numeric(20,0),
    nrfonte              bigint,
    nrfonteug            bigint,
    nrlicitacao          varchar,
    nrprojativ           bigint,
    nrempenho            bigint,
    progtrab             text,
    progtrabred          text,
    projativ             text,
    subfuncao            text,
    tp_empenho           text,
    unidade              text,
    vlr_empenho          numeric(18,2),
    vlr_anul_liquidacao  numeric(18,2),
    vlr_liquidacao       numeric(18,2),
    vlr_pagto            numeric(18,2),
    vlr_retencao         numeric(18,2),
    vlr_subempenho       numeric(18,2),
    vlr_empenhado        numeric(18,2),
    vlr_liquidado        numeric(18,2),
    vlr_pago             numeric(18,2),
    cgelem               bigint,
    cgprogtrab           bigint,
    cgigual              boolean,
    cod_elem             numeric(18,2),
    cod_pt               bigint,
    cg                   bigint,
    cgtitulo             text,
    cgdesc               text,
    cgtittce             text,
    cgfreq               bigint,
    cglevel              text,
    cgpai                bigint,
    cgroot               bigint,
    cgchild              bigint
);
"""

with engine.begin() as conn:
    print("Criando tabela...")
    conn.execute(text(ddl))

# 6. Inserir dados em lotes
print("Inserindo dados...")
batch_size = 5000
total = len(df)
inserted = 0
start_time = time.time()
last_log_time = start_time

cols = list(df.columns)
placeholders = ", ".join([f"%s" for _ in cols])
colnames = ", ".join(cols)  # agora tudo minúsculo, sem aspas
insert_sql = f'insert into empenhos ({colnames}) values ({placeholders}) on conflict do nothing'

conn = engine.raw_connection()
try:
    cur = conn.cursor()
    for start in range(0, total, batch_size):
        end = min(start + batch_size, total)
        batch = df.iloc[start:end].values.tolist()
        execute_batch(cur, insert_sql, batch, page_size=batch_size)
        conn.commit()
        inserted += len(batch)

        if inserted % 100000 < batch_size:
            now = time.time()
            elapsed = now - start_time
            interval = now - last_log_time
            print(f"{inserted}/{total} registros inseridos "
                  f"(tempo total: {elapsed:.1f}s, últimos 100k: {interval:.1f}s)")
            last_log_time = now
finally:
    conn.close()

end_time = time.time()
print(f"Inserção concluída em {end_time - start_time:.1f} segundos")

# 7. Criar índices
with engine.begin() as conn:
    print("Criando índices...")
    conn.execute(text('create index if not exists idx_ano on empenhos(ano);'))
    conn.execute(text('create index if not exists idx_cnpj on empenhos(cpfcnpjcredor);'))
    conn.execute(text('create index if not exists idx_nrlicitacao on empenhos(nrlicitacao);'))

print("Setup finalizado")
