DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'empenho_embeddings'
    ) THEN
        -- Índice ANN baseado em cosine similarity
        CREATE INDEX IF NOT EXISTS idx_empenho_embeddings_cosine
        ON empenho_embeddings
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);

        -- Atualiza estatísticas
        ANALYZE empenho_embeddings;
    ELSE
        RAISE NOTICE 'Tabela empenho_embeddings não existe; índice não criado (rodar após restore).';
    END IF;
END
$$;
