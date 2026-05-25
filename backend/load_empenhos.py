import argparse
import numbers
import os
import re
import time
from typing import Iterable

import pandas as pd
from dotenv import load_dotenv
from psycopg2.extras import execute_batch, execute_values
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine, URL


load_dotenv()


DB_USER = os.getenv("POSTGRES_USER")
DB_PASS = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST")
DB_PORT = os.getenv("POSTGRES_PORT")
DB_NAME = os.getenv("POSTGRES_DB")


EMPENHOS_SOURCE_COLUMNS = {
    "idempenho",
    "ano",
    "vlr_anulacaoempenho",
    "cdfontetce",
    "cdfonteug",
    "cnpjraiz",
    "cpfcnpjcredorqtnrs",
    "cpfcnpjcredor",
    "credor",
    "dtempenho",
    "defontetce",
    "defonteug",
    "deprograma",
    "deprojativ",
    "dtanomes",
    "elemento",
    "elemdespesatce",
    "elemdespesaug",
    "ente",
    "esfera",
    "funcao",
    "historico",
    "idcontrato",
    "idfonte",
    "idfuncao",
    "id_orgao",
    "idprograma",
    "idsubfuncao",
    "idunid",
    "idorgao",
    "nrfonte",
    "nrfonteug",
    "nrlicitacao",
    "nrprojativ",
    "nrempenho",
    "progtrab",
    "progtrabred",
    "projativ",
    "subfuncao",
    "tp_empenho",
    "unidade",
    "vlr_empenho",
    "vlr_anul_liquidacao",
    "vlr_liquidacao",
    "vlr_pagto",
    "vlr_retencao",
    "vlr_subempenho",
    "vlr_empenhado",
    "vlr_liquidado",
    "vlr_pago",
    "cgelem",
    "cgprogtrab",
    "cgigual",
    "cod_elem",
    "cod_pt",
    "cg",
    "cgtitulo",
    "cgdesc",
    "cgtittce",
    "cgfreq",
    "cglevel",
    "cgpai",
    "cgroot",
    "cgchild",
}

EMPENHOS_INSERT_COLUMNS = [
    "idempenho",
    "ano",
    "vlr_anulacaoempenho",
    "cdfontetce",
    "cdfonteug",
    "cnpjraiz",
    "cpfcnpjcredorqtnrs",
    "cpfcnpjcredor",
    "credor",
    "dtempenho",
    "defontetce",
    "defonteug",
    "deprograma",
    "deprojativ",
    "dtanomes",
    "elemento",
    "elemdespesatce",
    "elemdespesaug",
    "ente",
    "esfera",
    "funcao",
    "historico",
    "idcontrato",
    "idfonte",
    "idfuncao",
    "id_orgao",
    "idprograma",
    "idsubfuncao",
    "idunid",
    "idorgao",
    "nrfonte",
    "nrfonteug",
    "nrlicitacao",
    "nrprojativ",
    "nrempenho",
    "progtrab",
    "progtrabred",
    "projativ",
    "subfuncao",
    "tp_empenho",
    "unidade",
    "vlr_empenho",
    "vlr_anul_liquidacao",
    "vlr_liquidacao",
    "vlr_pagto",
    "vlr_retencao",
    "vlr_subempenho",
    "vlr_empenhado",
    "vlr_liquidado",
    "vlr_pago",
    "cgelem",
    "cgprogtrab",
    "cgigual",
    "cod_elem",
    "cod_pt",
    "cg",
    "cgtitulo",
    "cgdesc",
    "cgtittce",
    "cgfreq",
    "cglevel",
    "cgpai",
    "cgroot",
    "cgchild",
    "id_jurisdicionado",
]

CRITICAL_COLUMNS = ["idempenho", "ente", "ano", "idunid", "nrempenho", "elemdespesatce", "unidade"]

INTEGER_COLUMNS = [
    "ano",
    "cdfontetce",
    "cdfonteug",
    "cpfcnpjcredorqtnrs",
    "dtanomes",
    "elemento",
    "idfonte",
    "idfuncao",
    "idprograma",
    "idsubfuncao",
    "idunid",
    "nrfonte",
    "nrfonteug",
    "nrprojativ",
    "nrempenho",
    "cgelem",
    "cgprogtrab",
    "cod_pt",
    "cg",
    "cgfreq",
    "cgpai",
    "cgroot",
    "cgchild",
    "id_jurisdicionado",
]

NUMERIC_COLUMNS = [
    "vlr_anulacaoempenho",
    "id_orgao",
    "idorgao",
    "vlr_empenho",
    "vlr_anul_liquidacao",
    "vlr_liquidacao",
    "vlr_pagto",
    "vlr_retencao",
    "vlr_subempenho",
    "vlr_empenhado",
    "vlr_liquidado",
    "vlr_pago",
    "cod_elem",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Carrega empenhos no schema atual do PostgreSQL.")
    parser.add_argument("--input", default="data/tce_large.parquet", help="Arquivo parquet de entrada.")
    parser.add_argument("--batch-size", type=int, default=5000, help="Tamanho dos lotes de insert.")
    parser.add_argument("--dry-run", action="store_true", help="Valida e prepara os dados sem inserir.")
    parser.add_argument("--validate-only", action="store_true", help="Apenas valida o schema do banco.")
    parser.add_argument(
        "--truncate-empenhos",
        action="store_true",
        help="Executa TRUNCATE public.empenhos RESTART IDENTITY CASCADE antes da carga.",
    )
    parser.add_argument(
        "--upsert",
        action="store_true",
        help="Atualiza registros existentes quando idempenho já estiver carregado.",
    )
    parser.add_argument(
        "--ensure-indexes",
        action="store_true",
        help="Garante índices básicos caso o schema tenha sido criado sem eles.",
    )
    return parser.parse_args()


def get_engine() -> Engine:
    missing = [
        name
        for name, value in {
            "POSTGRES_USER": DB_USER,
            "POSTGRES_PASSWORD": DB_PASS,
            "POSTGRES_HOST": DB_HOST,
            "POSTGRES_PORT": DB_PORT,
            "POSTGRES_DB": DB_NAME,
        }.items()
        if not value
    ]
    if missing:
        raise RuntimeError(f"Variáveis de ambiente ausentes: {', '.join(missing)}")

    url = URL.create(
        "postgresql+psycopg2",
        username=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=int(DB_PORT),
        database=DB_NAME,
    )
    return create_engine(url)


def normalize_identifier(value, width: int | None = None) -> str | None:
    if pd.isna(value):
        return None

    if isinstance(value, numbers.Integral):
        value = str(value)
    elif isinstance(value, numbers.Real) and float(value).is_integer():
        value = str(int(value))
    else:
        value = str(value).strip()

    if not value:
        return None

    digits = re.sub(r"\D", "", value)
    if not digits:
        return value

    if width:
        return digits.zfill(width)[-width:]
    return digits


def normalize_string(value) -> str | None:
    if pd.isna(value):
        return None
    value = str(value).strip()
    return value or None


def normalize_bool(value):
    if pd.isna(value):
        return None
    if isinstance(value, bool):
        return value
    normalized = str(value).strip().lower()
    if normalized in {"true", "t", "1", "sim", "s", "yes", "y"}:
        return True
    if normalized in {"false", "f", "0", "nao", "não", "n", "no"}:
        return False
    return None


def load_dataframe(path: str) -> pd.DataFrame:
    print(f"Lendo arquivo parquet: {path}")
    df = pd.read_parquet(path)

    if "index" in df.columns:
        df = df.drop(columns=["index"])

    df.columns = [c.lower() for c in df.columns]
    df = df[[c for c in df.columns if c in EMPENHOS_SOURCE_COLUMNS]]

    missing = [c for c in CRITICAL_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Campos críticos ausentes no DataFrame: {missing}")

    before = len(df)
    df = df.drop_duplicates(subset=["idempenho"], keep="first")
    print(f"Linhas após remover duplicatas por idempenho: {len(df)} de {before}")
    print(f"idempenho únicos: {df['idempenho'].nunique()}")
    return df


def convert_types(df: pd.DataFrame) -> pd.DataFrame:
    print("Convertendo e normalizando tipos...")
    df = df.copy()

    if "dtempenho" in df.columns:
        df["dtempenho"] = pd.to_datetime(df["dtempenho"], errors="coerce").dt.date

    for col in INTEGER_COLUMNS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")

    for col in NUMERIC_COLUMNS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    for col in ["idempenho", "idcontrato", "nrlicitacao"]:
        if col in df.columns:
            df[col] = df[col].map(normalize_string)

    if "cnpjraiz" in df.columns:
        df["cnpjraiz"] = df["cnpjraiz"].map(lambda value: normalize_identifier(value, 8))

    if "cpfcnpjcredor" in df.columns:
        df["cpfcnpjcredor"] = df["cpfcnpjcredor"].map(normalize_identifier)

    if "cgigual" in df.columns:
        df["cgigual"] = df["cgigual"].map(normalize_bool)

    before = len(df)
    df = df.drop_duplicates(subset=["idempenho"], keep="first")
    if len(df) != before:
        print(f"Duplicatas adicionais após normalizar idempenho: {before - len(df)}")

    print("Conversão concluída")
    return df


def validate_database_schema(engine: Engine) -> None:
    print("Validando schema do banco...")
    required_tables = {"empenhos", "municipios", "jurisdicionados"}
    required_empenhos_columns = set(EMPENHOS_INSERT_COLUMNS) | {"id"}

    with engine.begin() as conn:
        tables = {
            row[0]
            for row in conn.execute(
                text(
                    """
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                      AND table_name = ANY(:tables)
                    """
                ),
                {"tables": list(required_tables)},
            )
        }
        missing_tables = sorted(required_tables - tables)
        if missing_tables:
            raise RuntimeError(
                "Tabelas ausentes no schema public: "
                f"{missing_tables}. Aplique sql/schema_dump.sql antes da carga."
            )

        columns = {
            row[0]
            for row in conn.execute(
                text(
                    """
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'empenhos'
                    """
                )
            )
        }
        missing_columns = sorted(required_empenhos_columns - columns)
        if missing_columns:
            raise RuntimeError(f"Colunas ausentes em public.empenhos: {missing_columns}")

        constraints = {
            row[0]
            for row in conn.execute(
                text(
                    """
                    SELECT constraint_name
                    FROM information_schema.table_constraints
                    WHERE table_schema = 'public'
                      AND table_name = 'empenhos'
                      AND constraint_name IN ('empenhos_pkey', 'empenhos_idempenho_uk', 'fk_jurisdicionado')
                    """
                )
            )
        }
        missing_constraints = sorted(
            {"empenhos_pkey", "empenhos_idempenho_uk", "fk_jurisdicionado"} - constraints
        )
        if missing_constraints:
            raise RuntimeError(f"Constraints ausentes em public.empenhos: {missing_constraints}")

        id_default = conn.execute(
            text(
                """
                SELECT column_default
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'empenhos'
                  AND column_name = 'id'
                """
            )
        ).scalar()
        if not id_default or "nextval" not in id_default:
            raise RuntimeError("public.empenhos.id não possui default de sequence.")

    print("Schema validado")


def truncate_empenhos(engine: Engine) -> None:
    with engine.begin() as conn:
        print("Truncando public.empenhos com RESTART IDENTITY CASCADE...")
        conn.execute(text("TRUNCATE TABLE public.empenhos RESTART IDENTITY CASCADE"))


def clean_dimension_pairs(df: pd.DataFrame) -> pd.DataFrame:
    pairs = df[["ente", "unidade"]].copy()
    pairs["ente"] = pairs["ente"].map(normalize_string)
    pairs["unidade"] = pairs["unidade"].map(normalize_string)
    return pairs.dropna(subset=["ente", "unidade"]).drop_duplicates()


def upsert_municipios(raw_conn, df: pd.DataFrame) -> None:
    municipios = sorted(clean_dimension_pairs(df)["ente"].drop_duplicates().tolist())
    if not municipios:
        print("Nenhum município válido encontrado para carregar.")
        return

    with raw_conn.cursor() as cur:
        execute_values(
            cur,
            """
            INSERT INTO public.municipios (nome)
            VALUES %s
            ON CONFLICT (nome) DO NOTHING
            """,
            [(nome,) for nome in municipios],
            page_size=5000,
        )
    print(f"Municípios verificados/inseridos: {len(municipios)}")


def upsert_jurisdicionados(raw_conn, df: pd.DataFrame) -> None:
    pairs = clean_dimension_pairs(df)
    if pairs.empty:
        print("Nenhum jurisdicionado válido encontrado para carregar.")
        return

    with raw_conn.cursor() as cur:
        execute_values(
            cur,
            """
            INSERT INTO public.jurisdicionados (nome, id_municipio)
            VALUES %s
            ON CONFLICT (nome, id_municipio) DO NOTHING
            """,
            [(row.unidade, row.ente) for row in pairs.itertuples(index=False)],
            template="""
            (
                %s,
                (SELECT id FROM public.municipios WHERE nome = %s)
            )
            """,
            page_size=5000,
        )
    print(f"Jurisdicionados verificados/inseridos: {len(pairs)}")


def attach_id_jurisdicionado(engine: Engine, df: pd.DataFrame) -> pd.DataFrame:
    print("Resolvendo id_jurisdicionado...")
    query = """
        SELECT
            m.nome AS ente,
            j.nome AS unidade,
            j.id AS id_jurisdicionado
        FROM public.jurisdicionados j
        JOIN public.municipios m ON m.id = j.id_municipio
    """
    mapping = pd.read_sql(query, engine)

    prepared = df.copy()
    prepared["ente"] = prepared["ente"].map(normalize_string)
    prepared["unidade"] = prepared["unidade"].map(normalize_string)
    prepared = prepared.drop(columns=["id_jurisdicionado"], errors="ignore")
    prepared = prepared.merge(mapping, how="left", on=["ente", "unidade"])
    prepared["id_jurisdicionado"] = pd.to_numeric(
        prepared["id_jurisdicionado"], errors="coerce"
    ).astype("Int64")

    missing_fk = prepared["id_jurisdicionado"].isna().sum()
    if missing_fk:
        print(f"Aviso: {missing_fk} empenhos ficaram sem id_jurisdicionado.")
    return prepared


def ensure_columns(df: pd.DataFrame, columns: Iterable[str]) -> pd.DataFrame:
    df = df.copy()
    for col in columns:
        if col not in df.columns:
            df[col] = None
    return df[list(columns)]


def dataframe_records(df: pd.DataFrame) -> list[tuple]:
    obj = df.astype(object)
    obj = obj.where(pd.notna(obj), None)
    return [tuple(row) for row in obj.itertuples(index=False, name=None)]


def build_insert_sql(upsert: bool) -> str:
    colnames = ", ".join(EMPENHOS_INSERT_COLUMNS)
    placeholders = ", ".join(["%s"] * len(EMPENHOS_INSERT_COLUMNS))

    if not upsert:
        conflict_clause = "ON CONFLICT (idempenho) DO NOTHING"
    else:
        assignments = ", ".join(
            f"{col} = EXCLUDED.{col}"
            for col in EMPENHOS_INSERT_COLUMNS
            if col != "idempenho"
        )
        conflict_clause = f"ON CONFLICT (idempenho) DO UPDATE SET {assignments}"

    return f"""
        INSERT INTO public.empenhos ({colnames})
        VALUES ({placeholders})
        {conflict_clause}
    """


def insert_empenhos(engine: Engine, df: pd.DataFrame, batch_size: int, upsert: bool) -> None:
    insert_df = ensure_columns(df, EMPENHOS_INSERT_COLUMNS)
    total = len(insert_df)
    insert_sql = build_insert_sql(upsert)

    print(f"Inserindo empenhos em lotes de {batch_size}...")
    start_time = time.time()
    last_log_time = start_time
    processed = 0

    raw_conn = engine.raw_connection()
    try:
        with raw_conn.cursor() as cur:
            for start in range(0, total, batch_size):
                end = min(start + batch_size, total)
                batch = dataframe_records(insert_df.iloc[start:end])
                execute_batch(cur, insert_sql, batch, page_size=batch_size)
                raw_conn.commit()
                processed += len(batch)

                if processed % 100000 < batch_size or processed == total:
                    now = time.time()
                    elapsed = now - start_time
                    interval = now - last_log_time
                    print(
                        f"{processed}/{total} registros processados "
                        f"(tempo total: {elapsed:.1f}s, intervalo: {interval:.1f}s)"
                    )
                    last_log_time = now
    finally:
        raw_conn.close()

    print(f"Inserção concluída em {time.time() - start_time:.1f} segundos")


def ensure_indexes(engine: Engine) -> None:
    with engine.begin() as conn:
        print("Garantindo índices básicos...")
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_ano ON public.empenhos(ano)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_cnpj ON public.empenhos(cpfcnpjcredor)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_nrlicitacao ON public.empenhos(nrlicitacao)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_empenhos_idempenho ON public.empenhos(idempenho)"))


def print_final_checks(engine: Engine) -> None:
    with engine.begin() as conn:
        checks = conn.execute(
            text(
                """
                SELECT
                    (SELECT COUNT(*) FROM public.empenhos) AS empenhos,
                    (SELECT COUNT(*) FROM public.empenhos WHERE id IS NULL) AS empenhos_sem_id,
                    (SELECT COUNT(*) FROM public.empenhos WHERE idempenho IS NULL) AS empenhos_sem_idempenho,
                    (SELECT COUNT(*) FROM public.empenhos WHERE id_jurisdicionado IS NULL) AS empenhos_sem_jurisdicionado,
                    (SELECT COUNT(*) FROM public.municipios) AS municipios,
                    (SELECT COUNT(*) FROM public.jurisdicionados) AS jurisdicionados
                """
            )
        ).mappings().one()

        duplicates = conn.execute(
            text(
                """
                SELECT COUNT(*)
                FROM (
                    SELECT idempenho
                    FROM public.empenhos
                    GROUP BY idempenho
                    HAVING COUNT(*) > 1
                ) d
                """
            )
        ).scalar_one()

    print("Verificações finais:")
    for key, value in checks.items():
        print(f"- {key}: {value}")
    print(f"- idempenho_duplicados: {duplicates}")


def load_dimensions(engine: Engine, df: pd.DataFrame, dry_run: bool) -> None:
    if dry_run:
        pairs = clean_dimension_pairs(df)
        print(f"Dry-run: municípios distintos: {pairs['ente'].nunique()}")
        print(f"Dry-run: jurisdicionados distintos: {len(pairs)}")
        return

    raw_conn = engine.raw_connection()
    try:
        upsert_municipios(raw_conn, df)
        upsert_jurisdicionados(raw_conn, df)
        raw_conn.commit()
    except Exception:
        raw_conn.rollback()
        raise
    finally:
        raw_conn.close()


def main() -> None:
    args = parse_args()
    engine = get_engine()

    validate_database_schema(engine)
    if args.validate_only:
        return

    if args.truncate_empenhos and not args.dry_run:
        truncate_empenhos(engine)

    df = load_dataframe(args.input)
    df = convert_types(df)

    load_dimensions(engine, df, dry_run=args.dry_run)

    if args.dry_run:
        print("Dry-run finalizado sem alterações em empenhos.")
        return

    df = attach_id_jurisdicionado(engine, df)
    insert_empenhos(engine, df, batch_size=args.batch_size, upsert=args.upsert)

    if args.ensure_indexes:
        ensure_indexes(engine)

    print_final_checks(engine)
    print("Carga finalizada")


if __name__ == "__main__":
    main()
