-- Índice ANN baseado em cosine similarity
CREATE INDEX IF NOT EXISTS idx_empenho_embeddings_cosine
ON empenho_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Atualiza estatísticas
ANALYZE empenho_embeddings;
