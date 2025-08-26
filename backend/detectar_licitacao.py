"""
Script para detectar número da licitação em históricos de empenho,
usando pipeline em duas fases (regex + LLM via LangChain).

NB: processa apenas empenhos onde o campo nrlicitacao está indefinido (NULL).

Exemplo de uso:
python detectar_licitacao.py --ano 2018 --saida licitacoes_2018.parquet --limite_grupos 10 --debug
"""

import os
import re
import time
import argparse
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from tqdm import tqdm

# LangChain
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# ==============================
# Parser de argumentos
# ==============================
parser = argparse.ArgumentParser(description="Detecção de número da licitação em empenhos")
parser.add_argument("--ano", type=int, required=True, help="Ano de análise")
parser.add_argument("--saida", type=str, default="licitacoes.parquet", help="Arquivo de saída")
parser.add_argument("--limite_grupos", type=int, default=None, help="Número máximo de grupos (para teste)")
parser.add_argument("--debug", action="store_true", help="Ativa logs detalhados")
args = parser.parse_args()

# ==============================
# Configurações do banco e LLM
# ==============================
load_dotenv()
DB_USER = os.getenv("POSTGRES_USER")
DB_PASS = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST")
DB_PORT = os.getenv("POSTGRES_PORT")
DB_NAME = os.getenv("POSTGRES_DB")

engine = create_engine(f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# LangChain LLM
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

prompt = PromptTemplate.from_template(
    """Extraia apenas o número da licitação do texto abaixo.
Se não houver, responda "N/A".

Texto: "{texto}"
"""
)
licitacao_chain = prompt | llm | StrOutputParser()

start_time = time.time()
print("[INFO] Script iniciado.")

# ==============================
# Funções auxiliares
# ==============================
REGEX_LIC = re.compile(r"LICITA(CAO|ÇÃO)?\s*(N\.?|Nº)?\s*[\w/-]+", re.IGNORECASE)

def has_licitacao(texto: str) -> bool:
    return bool(REGEX_LIC.search(texto or ""))

def extract_licitacao_llm(texto: str) -> str:
    return licitacao_chain.invoke({"texto": texto}).strip()

# ==============================
# Buscar grupos distintos
# ==============================
print(f"[INFO] Buscando chaves de grupos para o ano {args.ano}...")
query_keys = text("""
    SELECT DISTINCT ente, idunid, elemdespesatce, ano
    FROM empenhos_por_ano
    WHERE ano = :ano
""")

with engine.connect() as conn:
    keys = conn.execute(query_keys, {"ano": args.ano}).fetchall()

if args.limite_grupos:
    keys = keys[:args.limite_grupos]
    print(f"[INFO] Rodando em modo teste: processando apenas {len(keys)} grupos.")

print(f"[INFO] Total de grupos a processar: {len(keys)}")

# ==============================
# Processamento grupo a grupo
# ==============================
resultados = []
total_analisados = 0

with engine.connect() as conn:
    for ente, idunid, elem, ano in tqdm(keys, desc="Grupos processados"):
        # só considera empenhos onde nrlicitacao está nulo
        query = text("""
            SELECT idempenho, historico
            FROM empenhos_por_ano
            WHERE ano = :ano 
              AND ente = :ente 
              AND idunid = :idunid 
              AND elemdespesatce = :elem
              AND nrlicitacao IS NULL
        """)
        df = pd.read_sql(query, conn, params={
            "ano": ano, "ente": ente, "idunid": idunid, "elem": elem
        })
        if df.empty:
            continue

        total_analisados += len(df)

        for _, row in df.iterrows():
            idempenho = row["idempenho"]
            historico = row["historico"]

            possui = has_licitacao(historico)
            numero = None

            if possui:
                try:
                    numero = extract_licitacao_llm(historico)
                except Exception as e:
                    if args.debug:
                        print(f"[ERRO] Falha no LLM para idempenho {idempenho}: {e}")
                    numero = None

                resultados.append({
                    "ente": ente,
                    "idunid": idunid,
                    "ano": ano,
                    "elemdespesatce": elem,
                    "idempenho": idempenho,
                    "historico": historico,
                    "numero_licitacao": numero
                })

# ==============================
# Salvar resultados
# ==============================
df_out = pd.DataFrame(resultados)
df_out.to_parquet(args.saida, index=False, engine="fastparquet")

# ==============================
# Logs finais
# ==============================
print(f"[INFO] Processamento concluído.")
print(f"[INFO] Total de empenhos analisados (com nrlicitacao NULL): {total_analisados}")
print(f"[INFO] Total de empenhos exportados (regex detectou nº no histórico): {len(df_out)}")
print(f"[INFO] Proporção: {len(df_out)}/{total_analisados} = {(len(df_out)/total_analisados*100 if total_analisados else 0):.2f}%")
print(f"[INFO] Tempo total: {time.time() - start_time:.2f} segundos")
