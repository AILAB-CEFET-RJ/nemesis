from fastapi import APIRouter
from fastapi.encoders import jsonable_encoder
from typing import Optional
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
import pandas as pd
from sentence_transformers import SentenceTransformer

router = APIRouter()

# ======================================================
# Conexão com banco
# ======================================================
load_dotenv()
DB_USER = os.getenv("POSTGRES_USER")
DB_PASS = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST")
DB_PORT = os.getenv("POSTGRES_PORT")
DB_NAME = os.getenv("POSTGRES_DB")

engine = create_engine(
    f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# ======================================================
# Modelo de embeddings
# ======================================================
print("Carregando modelo de embeddings...")
model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
print("Modelo carregado!")

# ======================================================
# Função de negócio
# ======================================================
def sinalizar_sobrepreco(
    ano: int,
    descricao: str,
    max_dist: float = 0.3,
    limite: int = 500
):
    # gera embedding da descrição
    embedding_desc = model.encode([descricao])[0].astype("float32").tolist()

    # monta vetor SQL no formato ARRAY[...]::vector
    embedding_sql = "ARRAY[" + ",".join(str(x) for x in embedding_desc) + "]::vector"

    # consulta no banco usando pgvector
    query = f"""
        SELECT e.idempenho, e.ano, e.ente, e.historico, 
               e.vlr_empenhado, e.elemdespesatce,
               emb.embedding <=> {embedding_sql} AS distancia
        FROM empenhos e
        JOIN empenho_embeddings emb USING (idempenho)
        WHERE e.ano = {ano}
          AND (emb.embedding <=> {embedding_sql}) <= {max_dist}
        ORDER BY distancia
        LIMIT {limite}
    """

    df = pd.read_sql(query, engine)

    if df.empty:
        return {"erro": "Nenhum empenho semelhante encontrado"}, []

    # --- estatísticas completas
    valores = df["vlr_empenhado"].astype(float)
    q1, q3 = valores.quantile([0.25, 0.75])
    iqr = q3 - q1
    limiar = q3 + 1.5 * iqr

    resumo = {
        "ano": ano,
        "descricao": descricao,
        "n_resultados": len(df),
        "valor_medio": float(valores.mean()),
        "valor_mediano": float(valores.median()),
        "valor_min": float(valores.min()),
        "valor_max": float(valores.max()),
        "q1": float(q1),
        "q3": float(q3),
        "limiar_iqr": float(limiar)
    }

    return resumo, df.to_dict(orient="records")


# ======================================================
# Endpoint FastAPI
# ======================================================
@router.get("/api/sobrepreco")
def api_sobrepreco(
    ano: int,
    descricao: str,
    max_dist: float = 0.7,
    limite: int = 500
):
    resumo, empenhos = sinalizar_sobrepreco(
        ano=ano,
        descricao=descricao,
        max_dist=max_dist,
        limite=limite
    )

    return {
        "resumo": jsonable_encoder(resumo),
        "empenhos": jsonable_encoder(empenhos)
    }
