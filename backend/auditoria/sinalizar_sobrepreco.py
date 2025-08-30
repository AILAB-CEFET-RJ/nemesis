"""
Script: sinalizar_sobrepreco.py
Descrição: sinaliza indícios de sobrepreço comparando um empenho pivot
com empenhos semanticamente semelhantes de outras prefeituras no mesmo ano,
usando pgvector no PostgreSQL.

Exemplo de uso:
python auditoria/sinalizar_sobrepreco.py \
    --idempenho 201800360179100010000001127 \
    --ano 2018 \
    --max_dist 0.3 \
    --limite 200 \
    --saida auditoria/resultados/paracetamol2018
"""

import argparse
import os
from dotenv import load_dotenv
import pandas as pd
from sqlalchemy import create_engine, text
from scipy.stats import percentileofscore

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
def comparar_empenho(idempenho_pivot, ano, max_dist=0.3, limite=200, minimo_grupo=10, filtrar_elem=False):
    # --- Buscar empenho pivot
    query_pivot = text("""
        SELECT e.dtempenho, e.idempenho, e.ano, e.ente, e.historico, e.vlr_empenhado,
               e.elemdespesatce, emb.embedding
        FROM empenhos_por_ano e
        JOIN empenho_embeddings emb USING (idempenho)
        WHERE e.idempenho = :idempenho AND e.ano = :ano
    """)
    pivot = pd.read_sql(query_pivot, engine, params={"idempenho": idempenho_pivot, "ano": ano})
    if pivot.empty:
        print("Empenho pivot não encontrado.")
        return None, None

    historico_pivot = pivot["historico"].iloc[0]
    dt_pivot = pivot["dtempenho"].iloc[0]
    ente_pivot = pivot["ente"].iloc[0]
    elem_pivot = pivot["elemdespesatce"].iloc[0]
    valor_pivot = float(pivot["vlr_empenhado"].iloc[0])

    # --- Montar query dinâmica para vizinhos
    cond_elem = "AND e.elemdespesatce = :elem_pivot" if filtrar_elem else ""
    query_vizinhos = text(f"""
        WITH pivot AS (
            SELECT emb.embedding
            FROM empenho_embeddings emb
            WHERE emb.idempenho = :idempenho
        )
        SELECT e.idempenho, e.ente, e.historico, e.vlr_empenhado,
               e.elemdespesatce,
               emb.embedding <=> (SELECT embedding FROM pivot) AS distancia
        FROM empenhos_por_ano e
        JOIN empenho_embeddings emb USING (idempenho)
        WHERE e.ano = :ano
          AND e.ente <> :ente_pivot
          AND (emb.embedding <=> (SELECT embedding FROM pivot)) <= :max_dist
          {cond_elem}
        ORDER BY distancia
        LIMIT :limite;
    """)
    params = {
        "idempenho": idempenho_pivot,
        "ano": ano,
        "ente_pivot": ente_pivot,
        "max_dist": max_dist,
        "limite": limite,
    }
    if filtrar_elem:
        params["elem_pivot"] = elem_pivot

    df = pd.read_sql(query_vizinhos, engine, params=params)

    if len(df) < minimo_grupo:
        print(f"Grupo de comparação insuficiente ({len(df)} vizinhos encontrados).")
        return None, None

    # --- Estatísticas no grupo
    valores = df["vlr_empenhado"].astype(float)
    mediana = valores.median()
    q1, q3 = valores.quantile([0.25, 0.75])
    iqr = q3 - q1
    limiar = q3 + 1.5 * iqr
    desvio_percentual = (valor_pivot - mediana) / mediana * 100
    percentil_pivot = percentileofscore(valores, valor_pivot, kind="rank")

    resultado = {
        "dt_empenho": dt_pivot,
        "idempenho_pivot": idempenho_pivot,
        "ente_pivot": ente_pivot,
        "ano": ano,
        "elem_pivot": elem_pivot,
        "valor_pivot": valor_pivot,
        "historico_pivot": historico_pivot,
        "n_comparacoes": len(df),
        "mediana_estado": mediana,
        "q1": q1,
        "q3": q3,
        "limiar_iqr": limiar,
        "desvio_percentual": desvio_percentual,
        "percentil_pivot": percentil_pivot,
        "sobrepreco_suspeito": valor_pivot > limiar,
        "filtro_elemento": filtrar_elem
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
    parser.add_argument("--saida", type=str, required=False,
                        help="Prefixo para salvar resultados em CSV")
    parser.add_argument("--filtrar_elem", action="store_true",
                        help="Se presente, restringe comparação ao mesmo elemento de despesa TCE")
    args = parser.parse_args()

    resultado, vizinhos = comparar_empenho(
        idempenho_pivot=args.idempenho,
        ano=args.ano,
        max_dist=args.max_dist,
        limite=args.limite,
        filtrar_elem=args.filtrar_elem
    )

    if resultado:
        print("Resumo da comparação:")
        for k, v in resultado.items():
            print(f" - {k}: {v}")
        print("\nAmostra dos vizinhos recuperados:")
        print(vizinhos.head())

        # --- Enriquecer vizinhos com desvio em relação à mediana
        mediana_estado = resultado["mediana_estado"]
        vizinhos["desvio_percentual_mediana"] = (
            (vizinhos["vlr_empenhado"].astype(float) - mediana_estado) / mediana_estado * 100
        )

        # --- Exporta resultados se --saida foi fornecido
        if args.saida:
            resumo_df = pd.DataFrame([resultado])
            resumo_df.to_csv(f"{args.saida}_resumo.csv", index=False, encoding="utf-8")
            vizinhos.to_csv(f"{args.saida}_vizinhos.csv", index=False, encoding="utf-8")

            print(f"\nArquivos gerados: {args.saida}_resumo.csv e {args.saida}_vizinhos.csv")
