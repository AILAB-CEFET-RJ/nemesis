import os
from sqlalchemy import text
import pandas as pd
from routes.model_utils import create_embeddings
from routes.db import engine
from psycopg2.extensions import AsIs

def search_db(model, tokenizer, historico, ente, unidade, credor, elem_despesa):
    if historico != "":
        embed_query = create_embeddings(pd.Series(historico), model, tokenizer)[0]


    idempenhos = None
    params = {}

    with engine.connect() as conn:
        # 1) Se tem historico → busca embeddings
        if historico != "":
            vec_str = "'[" + ",".join([str(x) for x in embed_query.tolist()]) + "]'::vector"
            query_embeddings = text("""
                SELECT idempenho,
                    embedding <-> (:query_vec)::vector AS cosine_distance
                FROM empenho_embeddings
                ORDER BY cosine_distance
                LIMIT 50
            """)
            df_embeddings = pd.read_sql(
                query_embeddings,
                conn,
                params={"query_vec": AsIs(vec_str)}
            )
            idempenhos = df_embeddings["idempenho"].tolist()

        # 2) Montar filtros da query final
        filters = []
        if idempenhos:  # só adiciona se não estiver vazio
            filters.append("idempenho = ANY(:idempenhos)")
            params["idempenhos"] = idempenhos

        if ente:
            filters.append("ente = :ente")
            params["ente"] = ente
        if unidade:
            filters.append("unidade = :unidade")
            params["unidade"] = unidade
        if credor:
            filters.append("credor = :credor")
            params["credor"] = credor
        if elem_despesa:
            filters.append("elemdespesatce = :elemdespesa")
            params["elemdespesa"] = elem_despesa

        # 3) Query final em empenhos
        where_clause = " AND ".join(filters) if filters else "TRUE"
        query_df = text(f"""
            SELECT *
            FROM empenhos
            WHERE {where_clause}
        """)
        df_results = pd.read_sql(query_df, conn, params=params)



    # Colocar no formato aceitável pelo frontend:
    filtered = [
        {
            "document": row["historico"],  # ou outro campo que você considere "document"
            "metadata": {
                "idempenho": str(row["idempenho"]),
                "ente": str(row["ente"]),
                "unidade": str(row["unidade"]),
                "elemdespesatce": str(row["elemdespesatce"]),
                "credor": str(row["credor"]),
                "vlr_empenho": str(row["vlr_empenho"]),
            },
            "distance": None  # você não tem distância do SQL, mas pode deixar None ou 0
        }
        for _, row in df_results.iterrows()
    ]


    return filtered 


def get_unidades_uniques():
    query_df = text("""
        SELECT DISTINCT ente, unidade, idunid
        FROM empenhos
    """)

    with engine.connect() as conn:
        df_unidades = pd.read_sql(query_df, conn)

    # Force conversion to plain Python lists/strings
    result = (
        df_unidades
        .groupby("ente")[["unidade", "idunid"]]
        .apply(lambda g: [[str(u), str(i)] for u, i in g.values.tolist()])
        .to_dict()
    )

    return result

    
def get_elemdespesa_uniques(unidade):
    query_df_unidade = text("""
        SELECT DISTINCT elemdespesatce
        FROM empenhos
        WHERE unidade = :unidade
    """)
    query_df = text("""
        SELECT DISTINCT elemdespesatce
        FROM empenhos
    """)
        
    with engine.connect() as conn:
        if unidade != "":
            df_elemdespesa = pd.read_sql(
                query_df_unidade,
                conn,
                params={"unidade": unidade}
            )
        else:
            df_elemdespesa = pd.read_sql(
                query_df,
                conn,
            )
        
    return df_elemdespesa

def get_credores_uniques():
    query_df = text("""
        SELECT DISTINCT credor
        FROM empenhos
    """)
        
    with engine.connect() as conn:
        df_credores = pd.read_sql(
            query_df,
            conn,
        )
        
    return df_credores

def get_embeddings_3d(ente, unidade):
    query_df = text("""
        SELECT 
            e.elemdespesatce,
            AVG(ee.embedding_reduced) AS avg_embedding
        FROM empenho_embeddings ee
        JOIN empenhos e ON e.idempenho = ee.idempenho
        WHERE e.ente = :ente
        AND e.unidade = :unidade
        AND ee.embedding_reduced IS NOT NULL  
        GROUP BY e.elemdespesatce
    """)
    
    with engine.connect() as conn:
        df_embeddings_3d = pd.read_sql(
            query_df,
            conn,
            params={"ente": ente,
                    "unidade": unidade}
        )
    return df_embeddings_3d
    
def get_embeddings_3d_within_elem(elemdespesatce, ente, unidade):
    query_df = text("""
        SELECT ee.embedding_reduced, e.idempenho, e.historico, e.elemdespesatce, e.credor
        FROM empenho_embeddings ee
        JOIN empenhos e ON e.idempenho = ee.idempenho
        WHERE e.ente = :ente AND e.unidade = :unidade AND e.elemdespesatce = :elemdespesatce
    """)
    
    with engine.connect() as conn:
        df_embeddings_3d = pd.read_sql(
            query_df,
            conn,
            params={"elemdespesatce": elemdespesatce,
                    "ente": ente,
                    "unidade": unidade}  # safely bind parameters
        )
    return df_embeddings_3d