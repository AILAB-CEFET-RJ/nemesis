# TODO: Mostrar uma barra de progresso global (para saber quanto falta).
# TODO: Usar multiprocessamento (aproveitar mais núcleos da sua máquina).

import os
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import yaml
from tqdm import tqdm  # For progress bar

# ==========================
# Configurações
# ==========================

with open('config.yaml') as f:
    config = yaml.safe_load(f)

BATCH_SIZE = 128
MODEL_NAME = config['embedding_model']

# Carregar variáveis do .env
load_dotenv()

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
            embedding_reduced vector(3),
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
    
# Embeddings reduzidos para projeção 3d
reduced_embeds = np.load("data/reduced_embeds.npy")

# ==========================
# Geração em lotes
# ==========================
for start in tqdm(range(0, len(df), BATCH_SIZE)):
    end = min(start + BATCH_SIZE, len(df))
    batch = df.iloc[start:end]

    embeddings = model.encode(
        batch["historico"].tolist(),
        batch_size=BATCH_SIZE,
        show_progress_bar=True,
    )
    
    # fatia os embeddings reduzidos correspondentes ao batch
    reduced_batch = reduced_embeds[start:end]

    # Inserir embeddings no banco
    with engine.begin() as conn:
        for idempenho, emb, emb_red in zip(batch["idempenho"], embeddings, reduced_batch):
            vector_str = "[" + ",".join([f"{x:.6f}" for x in emb]) + "]"
            vector_red_str = "[" + ",".join([f"{x:.6f}" for x in emb_red]) + "]"

            conn.execute(
                text("""
                    INSERT INTO empenho_embeddings (idempenho, embedding, embedding_reduced, embedding_array)
                    VALUES (:id, :vec, :vec_reduced, :arr)
                    ON CONFLICT (idempenho) DO NOTHING
                """),
                {
                    "id": idempenho,
                    "vec": vector_str,   # para pgvector
                    "vec_reduced": vector_red_str,
                    "arr": emb.tolist()  # para leitura rápida no Python
                }
            )

    print(f"Processado lote {start} - {end}")

print("Embeddings gerados e armazenados com sucesso!")
