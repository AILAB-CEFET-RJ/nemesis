"""
Script: comparar_empenho_pgvector.py
Descrição: compara um empenho pivot contra empenhos semanticamente semelhantes
de outras prefeituras no mesmo ano, usando pgvector no PostgreSQL.

Exemplo de uso:
python comparar_empenho_pgvector.py --idempenho 123456 --ano 2022 --max_dist 0.3 --limite 200
"""

import argparse
import os
from dotenv import load_dotenv
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text

# ======================================================
# 1. Conexão com banco
# ======================================================
load_dotenv()
DB_USER = os.getenv("POSTGRES_USER")
DB_PASS = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST")
DB_PORT = os.getenv("POSTGRES_PORT")
DB_NAME = os.getenv("POSTGRES_DB")
engine = create_engine(f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# ======================================================
# 2. Função principal
# ======================================================
def comparar_empenho(idempenho_pivot, ano, max_dist=0.3, limite=200, minimo_grupo=10):
    # --- Buscar empenho pivot
    query_pivot = text("""
        SELECT e.idempenho, e.ano, e.ente, e.historico, e.vlr_empenhado, emb.embedding
        FROM empenhos_por_ano e
        JOIN empenho_embeddings emb USING (idempenho)
        WHERE e.idempenho = :idempenho AND e.ano = :ano
    """)
    pivot = pd.read_sql(query_pivot, engine, params={"idempenho": idempenho_pivot, "ano": ano})
    if pivot.empty:
        print("Empenho pivot não encontrado.")
        return None
    
    ente_pivot = pivot["ente"].iloc[0]
    valor_pivot = float(pivot["vlr_empenhado"].iloc[0])

    # --- Buscar vizinhos similares via pgvector
    query_vizinhos = text("""
        WITH pivot AS (
            SELECT emb.embedding
            FROM empenho_embeddings emb
            WHERE emb.idempenho = :idempenho
        )
        SELECT e.idempenho, e.ente, e.historico, e.vlr_empenhado,
               emb.embedding <=> (SELECT embedding FROM pivot) AS distancia
        FROM empenhos_por_ano e
        JOIN empenho_embeddings emb USING (idempenho)
        WHERE e.ano = :ano
          AND e.ente <> :ente_pivot
          AND (emb.embedding <=> (SELECT embedding FROM pivot)) <= :max_dist
        ORDER BY distancia
        LIMIT :limite;
    """)
    df = pd.read_sql(query_vizinhos, engine, params={
        "idempenho": idempenho_pivot,
        "ano": ano,
        "ente_pivot": ente_pivot,
        "max_dist": max_dist,
        "limite": limite
    })

    if len(df) < minimo_grupo:
        print(f"Grupo de comparação insuficiente ({len(df)} vizinhos encontrados).")
        return None

    # --- Estatísticas no grupo
    valores = df["vlr_empenhado"].astype(float)
    mediana = valores.median()
    q1, q3 = valores.quantile([0.25, 0.75])
    iqr = q3 - q1
    limiar = q3 + 1.5 * iqr
    desvio_percentual = (valor_pivot - mediana) / mediana * 100

    resultado = {
        "idempenho_pivot": idempenho_pivot,
        "ente_pivot": ente_pivot,
        "ano": ano,
        "valor_pivot": valor_pivot,
        "n_comparacoes": len(df),
        "mediana_estado": mediana,
        "q1": q1,
        "q3": q3,
        "limiar_iqr": limiar,
        "desvio_percentual": desvio_percentual,
        "sobrepreco_suspeito": valor_pivot > limiar
    }

    return resultado, df


# ======================================================
# Execução via linha de comando
# ======================================================
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--idempenho", type=str, required=True)
    parser.add_argument("--ano", type=int, required=True)
    parser.add_argument("--max_dist", type=float, default=0.3,
                        help="Distância máxima no espaço vetorial (pgvector)")
    parser.add_argument("--limite", type=int, default=200,
                        help="Número máximo de vizinhos a recuperar")
    args = parser.parse_args()

    resultado, vizinhos = comparar_empenho(
        idempenho_pivot=args.idempenho,
        ano=args.ano,
        max_dist=args.max_dist,
        limite=args.limite
    )

    if resultado:
        print("Resumo da comparação:")
        for k, v in resultado.items():
            print(f" - {k}: {v}")
        print("\nAmostra dos vizinhos recuperados:")
        print(vizinhos.head())
