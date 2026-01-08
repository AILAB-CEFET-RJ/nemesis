# TODO: Mostrar uma barra de progresso global (para saber quanto falta).
# TODO: Usar multiprocessamento (aproveitar mais núcleos da sua máquina).

import os
import argparse
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import yaml
from tqdm import tqdm
import zipfile
import requests
import tempfile
import shutil
from pathlib import Path
import mindspore.dataset as ds

# ==========================
# Configurações
# ==========================

# Parse command line arguments
parser = argparse.ArgumentParser(description="Generate embeddings for empenhos")
parser.add_argument(
    "--framework",
    choices=["mindspore", "huggingface"],
    default="huggingface",
    help="Framework to use: mindspore (GloVe embeddings) or huggingface (SentenceTransformers)"
)
args = parser.parse_args()

with open('config.yaml') as f:
    config = yaml.safe_load(f)

BATCH_SIZE = 128
MODEL_NAME = config['embedding_model']
CACHE_DIR = Path.home() / ".mindspore_examples"
CACHE_DIR.mkdir(exist_ok=True)

# Carregar variáveis do .env
load_dotenv()

DB_USER = os.getenv("POSTGRES_USER")
DB_PASS = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST")
DB_PORT = os.getenv("POSTGRES_PORT")
DB_NAME = os.getenv("POSTGRES_DB")

# ==========================
# GloVe Utilities (MindSpore mode)
# ==========================
def http_get(url: str, temp_file):
    """Download file with progress bar"""
    req = requests.get(url, stream=True)
    total = int(req.headers.get("Content-Length", 0))
    progress = tqdm(total=total, unit="B", unit_scale=True, desc="Downloading")
    for chunk in req.iter_content(chunk_size=1024):
        if chunk:
            temp_file.write(chunk)
            progress.update(len(chunk))
    progress.close()

def download(file_name: str, url: str):
    """Download file if not in cache"""
    cache_path = CACHE_DIR / file_name
    if not cache_path.exists():
        print(f"Downloading {file_name}...")
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            http_get(url, temp_file)
            temp_file.flush()
            temp_file.seek(0)
            with open(cache_path, "wb") as f:
                shutil.copyfileobj(temp_file, f)
        os.unlink(temp_file.name)
    return str(cache_path)

def load_glove():
    """Load GloVe embeddings and create vocabulary"""
    glove_zip = download(
        "glove.6B.zip",
        "https://mindspore-website.obs.myhuaweicloud.com/notebook/datasets/glove.6B.zip"
    )
    
    glove_txt = CACHE_DIR / "glove.6B.100d.txt"
    if not glove_txt.exists():
        print("Extracting GloVe vectors...")
        with zipfile.ZipFile(glove_zip) as z:
            z.extractall(CACHE_DIR)

    print("Loading GloVe embeddings...")
    tokens, embeddings = [], []
    with open(glove_txt, encoding="utf-8") as f:
        for line in tqdm(f, desc="Loading GloVe"):
            word, vec = line.split(maxsplit=1)
            tokens.append(word)
            embeddings.append(np.fromstring(vec, sep=" ", dtype=np.float32))

    # Add special tokens
    embeddings.append(np.random.rand(100).astype(np.float32))  # <unk>
    embeddings.append(np.zeros(100, dtype=np.float32))         # <pad>

    vocab = ds.text.Vocab.from_list(
        tokens,
        special_tokens=["<unk>", "<pad>"],
        special_first=False
    )

    return vocab, np.array(embeddings, dtype=np.float32)

class MindSporeEmbedder:
    """GloVe-based embedder using MindSpore vocabulary"""
    
    def __init__(self):
        self.vocab, self.embeddings = load_glove()
        self.unk_id = self.vocab.tokens_to_ids("<unk>")
        self.pad_id = self.vocab.tokens_to_ids("<pad>")
        print(f"Loaded vocabulary with {len(self.vocab.vocab())} tokens")
        print(f"Embedding dimension: {self.embeddings.shape[1]}d")
    
    def encode(self, texts, batch_size=None, show_progress_bar=False):
        """
        Encode texts to 384-dimensional embeddings.
        Strategy: Pad/truncate to exactly 384 tokens, then average pool to 384d
        """
        results = []
        iterator = tqdm(texts, desc="Encoding") if show_progress_bar else texts
        
        MAX_TOKENS = 384  # Match target dimension
        
        for text in iterator:
            # Tokenize (simple whitespace split + lowercase)
            tokens = text.lower().split()
            
            # Convert to IDs
            ids = []
            for token in tokens:
                token_id = self.vocab.tokens_to_ids(token)
                # If token not found, use <unk>
                if token_id is None:
                    token_id = self.unk_id
                ids.append(token_id)
            
            # Pad or truncate to exactly 384 tokens
            if len(ids) < MAX_TOKENS:
                # Pad short sentences: [w1, w2, ..., <pad>, <pad>, ...]
                ids.extend([self.pad_id] * (MAX_TOKENS - len(ids)))
            else:
                # Truncate long sentences: keep first 384 tokens
                ids = ids[:MAX_TOKENS]
            
            # Lookup embeddings: Shape [384, 100]
            token_embeddings = self.embeddings[ids]
            
            # Average pooling across tokens: [384, 100] -> [100]
            # Then tile/repeat to reach 384d: [100] -> [384]
            mean_embedding = token_embeddings.mean(axis=0)  # Shape: [100]
            
            # Repeat to fill 384 dimensions (3.84 times)
            # Strategy: concatenate 3 full copies + partial 4th copy
            final_embedding = np.concatenate([
                mean_embedding,  # 100d
                mean_embedding,  # 100d
                mean_embedding,  # 100d
                mean_embedding[:84]  # 84d (to reach 384 total)
            ])
            
            results.append(final_embedding)
    
        return np.array(results, dtype=np.float32)

# ==========================
# Conexão com PostgreSQL
# ==========================
engine = create_engine(
    f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=disable"
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
    WHERE idempenho NOT IN (SELECT idempenho FROM empenho_embeddings);
"""
df = pd.read_sql(query, engine)
print(f"Registros a processar: {len(df)}")

if len(df) == 0:
    print("Todos os embeddings já foram gerados.")
    exit(0)

# ==========================
# Modelo de embeddings
# ==========================
if args.framework == "mindspore":
    print("Usando MindSpore com embeddings GloVe")
    model = MindSporeEmbedder()
else:
    print(f"Usando SentenceTransformer: {MODEL_NAME}")
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
