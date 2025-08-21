# TODO: Mostrar uma barra de progresso global (para saber quanto falta).
# TODO: Usar multiprocessamento (aproveitar mais núcleos da sua máquina).

import os
import pandas as pd
from sqlalchemy import create_engine, text
from sentence_transformers import SentenceTransformer

# ==========================
# Configurações
# ==========================
BATCH_SIZE = 128
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

DB_USER = os.getenv("POSTGRES_USER")
DB_PASS = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST")
DB_PORT = os.getenv("POSTGRES_PORT")
DB_NAME = os.getenv("POSTGRES_DB")

# ==========================
# Conexão com PostgreSQL
# ==========================
engine = create_engine(
    f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# ==========================
# Preparar banco para embeddings
# ==========================
with engine.begin() as conn:
    # Habilitar extensão pgvector (se ainda não estiver habilitada)
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

    # Criar tabela para embeddings (já com a coluna auxiliar float4[])
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS empenho_embeddings (
            idempenho varchar PRIMARY KEY,
            embedding vector(384),
            embedding_array float4[]
        )
    """))

# ==========================
# Carregar dados do banco
# ==========================
query = """
    SELECT idempenho, historico 
    FROM empenhos 
    WHERE idempenho NOT IN (SELECT idempenho FROM empenho_embeddings)
"""
df = pd.read_sql(query, engine)
print(f"Registros a processar: {len(df)}")

if len(df) == 0:
    print("Todos os embeddings já foram gerados.")
    exit(0)

# ==========================
# Modelo de embeddings
# ==========================
model = SentenceTransformer(MODEL_NAME)

# ==========================
# Geração em lotes
# ==========================
for start in range(0, len(df), BATCH_SIZE):
    end = min(start + BATCH_SIZE, len(df))
    batch = df.iloc[start:end]

    embeddings = model.encode(
        batch["historico"].tolist(),
        batch_size=BATCH_SIZE,
        show_progress_bar=True
    )

    # Inserir embeddings no banco
    with engine.begin() as conn:
        for idempenho, emb in zip(batch["idempenho"], embeddings):
            vector_str = "[" + ",".join([f"{x:.6f}" for x in emb]) + "]"
            conn.execute(
                text("""
                    INSERT INTO empenho_embeddings (idempenho, embedding, embedding_array)
                    VALUES (:id, :vec, :arr)
                    ON CONFLICT (idempenho) DO NOTHING
                """),
                {
                    "id": idempenho,
                    "vec": vector_str,   # para pgvector
                    "arr": emb.tolist()  # para leitura rápida no Python
                }
            )

    print(f"Processado lote {start} - {end}")

print("Embeddings gerados e armazenados com sucesso!")
