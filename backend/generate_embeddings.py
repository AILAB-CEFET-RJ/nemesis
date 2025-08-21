import os
import pandas as pd
from sqlalchemy import create_engine, text
from sentence_transformers import SentenceTransformer

# ==========================
# Configurações
# ==========================
BATCH_SIZE = 128
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

DB_USER = os.getenv("POSTGRES_USER", "nemesis")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "nemesis")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "empenhos")

# ==========================
# Conexão com PostgreSQL
# ==========================
engine = create_engine(f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# ==========================
# Preparar banco para embeddings
# ==========================
with engine.begin() as conn:
    # Habilitar extensão pgvector (se ainda não estiver habilitada)
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

    # Criar tabela para embeddings
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS empenho_embeddings (
            idempenho varchar PRIMARY KEY,
            embedding vector(384)
        )
    """))

# ==========================
# Carregar dados do banco
# ==========================
query = "SELECT idempenho, historico FROM empenhos WHERE idempenho NOT IN (SELECT idempenho FROM empenho_embeddings)"
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

    embeddings = model.encode(batch["historico"].tolist(), batch_size=BATCH_SIZE, show_progress_bar=True)

    # Inserir embeddings no banco
    with engine.begin() as conn:
        for idempenho, emb in zip(batch["idempenho"], embeddings):
            vector_str = "[" + ",".join([f"{x:.6f}" for x in emb]) + "]"
            conn.execute(
                text("INSERT INTO empenho_embeddings (idempenho, embedding) VALUES (:id, :vec) "
                     "ON CONFLICT (idempenho) DO NOTHING"),
                {"id": idempenho, "vec": vector_str}
            )

    print(f"Processado lote {start} - {end}")

print("Embeddings gerados e armazenados com sucesso!")
