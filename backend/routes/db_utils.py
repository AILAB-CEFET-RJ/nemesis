import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import pandas as pd

from routes.model_utils import create_embeddings, load_model_tokenizer
from routes.db import engine   # ✅ no circular import

def search_db(historico, ente, unidade, credor, elem_despesa):
    if historico != "":
        model, tokenizer = load_model_tokenizer()
        embed_query = create_embeddings(pd.Series(historico), model, tokenizer)[0]
        vec_str = "[" + ",".join([str(x) for x in embed_query.tolist()]) + "]"
    

    load_dotenv()

    DB_USER = os.getenv("POSTGRES_USER")
    DB_PASS = os.getenv("POSTGRES_PASSWORD")
    DB_HOST = os.getenv("POSTGRES_HOST")
    DB_PORT = os.getenv("POSTGRES_PORT")
    DB_NAME = os.getenv("POSTGRES_DB")


    engine = create_engine(
        f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )


    filters = []
    params = {"ente": ente, "unidade": unidade, "credor": credor, "elemdespesatce": elem_despesa}

    # 1) Query de embeddings
    query_embeddings = text("""
        SELECT idempenho,
            1 - (embedding <=> :query_vec) AS score
        FROM empenho_embeddings
        WHERE 1 - (embedding <=> :query_vec) > 0.90
        ORDER BY score DESC
        LIMIT 50
    """)

    # 2) Construir filtros adicionais para a segunda query
    filters = ["idempenho = ANY(:idempenhos)"]
    params = {"idempenhos": []}  # só obrigatório esse

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

    # Monta query final
    query_df = text(f"""
        SELECT *
        FROM empenhos
        WHERE {" AND ".join(filters)}
    """)


    idempenhos = None
    with engine.connect() as conn:
        if historico != "":
            # Busca idempenho por embeddings
            df_embeddings = pd.read_sql(
                query_embeddings,
                conn,
                params={"query_vec": vec_str}
            )

            idempenhos = df_embeddings["idempenho"].tolist()
            if not idempenhos:
                print("Nenhum resultado por embeddings → buscar todos os idempenhos")
                
                # Busca todos os idempenhos da base
                all_ids = pd.read_sql(
                    "SELECT idempenho FROM empenhos",
                    conn
                )["idempenho"].tolist()

                params["idempenhos"] = all_ids
            else:
                df_results = pd.read_sql(
                    query_df,
                    conn,
                    params=params
                )
        else:
            print("Historico não inputado → buscar todos os idempenhos")
            all_ids = pd.read_sql(
                    "SELECT idempenho FROM empenhos",
                    conn
                )["idempenho"].tolist()

            params["idempenhos"] = all_ids

            # Busca final
            df_results = pd.read_sql(
                query_df,
                conn,
                params=params
            )


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


    return filtered #df_results[['idempenho','ente', 'unidade', 'elemdespesatce', 'credor', 'historico', 'vlr_empenho']]

def get_unidades_uniques(ente_value):
    query_df = text("""
        SELECT DISTINCT unidade, idunid
        FROM empenhos
        WHERE ente = :ente
    """)
    
    with engine.connect() as conn:
        df_unidades = pd.read_sql(
            query_df,
            conn,
            params={"ente": ente_value}  # safely bind parameter
        )
    
    return df_unidades

def get_entes_uniques():
    query_df = text("""
        SELECT DISTINCT ente
        FROM empenhos
    """)
        
    with engine.connect() as conn:
        df_entes = pd.read_sql(
            query_df,
            conn,
        )
        
    return df_entes
    
def get_elemdespesa_uniques(unidade):
    query_df_unidade = text("""
        SELECT DISTINCT elemdespesatce
        FROM empenhos
        WHERE unidade = :unidade
    """)
    query_df = text("""
        SELECT DISTINCT elemdespesatce
        FROM empenhos
        WHERE unidade = :unidade
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