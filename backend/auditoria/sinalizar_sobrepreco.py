"""
Script: sinalizar_sobrepreco.py
Descrição: sinaliza indícios de sobrepreço comparando um conjunto de empenhos
(selecionados por filtros) com empenhos semanticamente semelhantes de outras prefeituras
no mesmo ano, usando pgvector no PostgreSQL.

Agora também salva os empenhos individuais do grupo pivot que estão acima do limiar
e mostra o percentil individual de cada empenho em relação ao grupo de comparação.

Exemplo de uso:
python auditoria/sinalizar_sobrepreco.py \
    --descricao "paracetamol" \
    --ano 2019 \
    --max_dist 0.3 \
    --limite 500 \
    --saida auditoria/resultados/paracetamol2019
"""

import argparse
import os
from dotenv import load_dotenv
import pandas as pd
from sqlalchemy import create_engine, text
from scipy.stats import percentileofscore
import numpy as np

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
def comparar_grupo(ano, descricao=None, elem=None, ente=None,
                   max_dist=0.3, limite=500, minimo_grupo=10):
    # --- Buscar grupo de interesse
    conds = ["e.ano = :ano"]
    params = {"ano": ano}

    if descricao:
        conds.append("e.historico ILIKE :descricao")
        params["descricao"] = f"%{descricao}%"
    if elem:
        conds.append("e.elemdespesatce = :elem")
        params["elem"] = elem
    if ente:
        conds.append("e.ente = :ente")
        params["ente"] = ente

    query_grupo = text(f"""
        SELECT e.idempenho, e.ano, e.ente, e.historico, e.vlr_empenhado,
               e.elemdespesatce, emb.embedding_array
        FROM empenhos e
        JOIN empenho_embeddings emb USING (idempenho)
        WHERE {" AND ".join(conds)}
    """)

    grupo = pd.read_sql(query_grupo, engine, params=params)
    if grupo.empty:
        print("Nenhum empenho encontrado para os filtros.")
        return None, None, None

    # --- Criar embedding médio do grupo como "pivot"
    embeddings = np.vstack([np.array(vec, dtype=np.float32) for vec in grupo["embedding_array"]])
    embedding_pivot = embeddings.mean(axis=0)

    # Converter embedding médio em string no formato pgvector
    embedding_str = "[" + ",".join(str(x) for x in embedding_pivot.tolist()) + "]"

    # --- Buscar vizinhos no estado (exceto mesmo ente, se ente foi passado)
    cond_ente = "AND e.ente <> :ente" if ente else ""
    query_vizinhos = text(f"""
        SELECT e.idempenho, e.ente, e.historico, e.vlr_empenhado,
               e.elemdespesatce,
               emb.embedding <=> :embedding_pivot AS distancia
        FROM empenhos e
        JOIN empenho_embeddings emb USING (idempenho)
        WHERE e.ano = :ano
          {cond_ente}
          AND (emb.embedding <=> :embedding_pivot) <= :max_dist
        ORDER BY distancia
        LIMIT :limite;
    """)

    params_viz = {
        "ano": ano,
        "embedding_pivot": embedding_str,
        "max_dist": max_dist,
        "limite": limite
    }
    if ente:
        params_viz["ente"] = ente

    df = pd.read_sql(query_vizinhos, engine, params=params_viz)

    if len(df) < minimo_grupo:
        print(f"Grupo de comparação insuficiente ({len(df)} vizinhos encontrados).")
        return None, None, None

    # --- Estatísticas do grupo de comparação
    valores = df["vlr_empenhado"].astype(float)
    mediana = valores.median()
    q1, q3 = valores.quantile([0.25, 0.75])
    iqr = q3 - q1
    limiar = q3 + 1.5 * iqr

    # Comparar valores do grupo pivot com estatísticas do estado
    valor_medio_pivot = grupo["vlr_empenhado"].astype(float).mean()
    desvio_percentual = (valor_medio_pivot - mediana) / mediana * 100
    percentil_pivot = percentileofscore(valores, valor_medio_pivot, kind="rank")

    resultado = {
        "ano": ano,
        "descricao": descricao,
        "elem": elem,
        "ente": ente,
        "n_pivot": len(grupo),
        "valor_medio_pivot": valor_medio_pivot,
        "mediana_estado": mediana,
        "q1": q1,
        "q3": q3,
        "limiar_iqr": limiar,
        "desvio_percentual": desvio_percentual,
        "percentil_pivot": percentil_pivot,
        "sobrepreco_suspeito": valor_medio_pivot > limiar,
        "n_comparacoes": len(df)
    }

    # --- Checar empenhos individuais do grupo
    grupo_individual = grupo.copy()
    grupo_individual["vlr_empenhado"] = grupo_individual["vlr_empenhado"].astype(float)
    grupo_individual["sobrepreco_suspeito"] = grupo_individual["vlr_empenhado"] > limiar
    grupo_individual["desvio_percentual_mediana"] = (
        (grupo_individual["vlr_empenhado"] - mediana) / mediana * 100
    )
    grupo_individual["percentil_individual"] = grupo_individual["vlr_empenhado"].apply(
        lambda v: percentileofscore(valores, v, kind="rank")
    )

    return resultado, df, grupo_individual


# ======================================================
# Execução via linha de comando
# ======================================================
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ano", type=int, required=True)
    parser.add_argument("--descricao", type=str, help="Termo para buscar no histórico")
    parser.add_argument("--elemdespesatce", type=str, help="Elemento de despesa TCE")
    parser.add_argument("--ente", type=str, help="Município / ente específico")
    parser.add_argument("--max_dist", type=float, default=0.3)
    parser.add_argument("--limite", type=int, default=500)
    parser.add_argument("--saida", type=str, help="Prefixo para salvar resultados em CSV")
    args = parser.parse_args()

    resultado, vizinhos, grupo_individual = comparar_grupo(
        ano=args.ano,
        descricao=args.descricao,
        elem=args.elemdespesatce,
        ente=args.ente,
        max_dist=args.max_dist,
        limite=args.limite
    )

    if resultado:
        print("Resumo da comparação:")
        for k, v in resultado.items():
            print(f" - {k}: {v}")

        print("\nAmostra dos vizinhos recuperados:")
        print(vizinhos.head())

        print("\nEmpenhos do grupo pivot analisados individualmente:")
        print(grupo_individual[["idempenho", "ente", "vlr_empenhado", "sobrepreco_suspeito", "percentil_individual"]].head())

        if args.saida:
            resumo_df = pd.DataFrame([resultado])
            resumo_df.to_csv(f"{args.saida}_resumo.csv", index=False, encoding="utf-8")
            vizinhos.to_csv(f"{args.saida}_vizinhos.csv", index=False, encoding="utf-8")
            grupo_individual.to_csv(f"{args.saida}_grupo.csv", index=False, encoding="utf-8")
            print(f"\nArquivos gerados: {args.saida}_resumo.csv, {args.saida}_vizinhos.csv, {args.saida}_grupo.csv")
