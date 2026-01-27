-- Variabilidade Semantica: tabela de cache e indices de performance

CREATE TABLE IF NOT EXISTS public.variabilidade_cache (
    id bigserial PRIMARY KEY,
    group_by text NOT NULL,
    group_key text NOT NULL,
    cnpjraiz text NOT NULL,
    min_n integer NOT NULL,
    mode text NOT NULL,
    n_empenhos integer NOT NULL,
    semantic_variability numeric,
    mean_date date,
    total_value numeric,
    computed_at timestamptz NOT NULL DEFAULT now(),
    max_dtempenho date
);

-- Unicidade do cache por combinacao de filtros.
CREATE UNIQUE INDEX IF NOT EXISTS uq_variabilidade_cache_key
    ON public.variabilidade_cache (group_by, group_key, cnpjraiz, min_n, mode);

-- Busca por registros mais recentes.
CREATE INDEX IF NOT EXISTS idx_variabilidade_cache_computed_at
    ON public.variabilidade_cache (computed_at);

-- Indices para acelerar a variabilidade semantica
-- Join embeddings -> empenhos.
CREATE INDEX IF NOT EXISTS idx_empenho_embeddings_id_empenho
    ON public.empenho_embeddings (id_empenho);

-- Filtro por ente + cnpjraiz.
CREATE INDEX IF NOT EXISTS idx_empenhos_cnpjraiz_ente
    ON public.empenhos (cnpjraiz, ente);

-- Filtro por jurisdicionado + cnpjraiz.
CREATE INDEX IF NOT EXISTS idx_empenhos_cnpjraiz_idunid
    ON public.empenhos (cnpjraiz, idunid);

-- Ordenacao por data (ente).
CREATE INDEX IF NOT EXISTS idx_empenhos_ente_dtempenho
    ON public.empenhos (cnpjraiz, ente, dtempenho);

-- Ordenacao por valor (ente).
CREATE INDEX IF NOT EXISTS idx_empenhos_ente_vlr
    ON public.empenhos (cnpjraiz, ente, vlr_empenhado);

-- Ordenacao por data (jurisdicionado).
CREATE INDEX IF NOT EXISTS idx_empenhos_idunid_dtempenho
    ON public.empenhos (cnpjraiz, idunid, dtempenho);

-- Ordenacao por valor (jurisdicionado).
CREATE INDEX IF NOT EXISTS idx_empenhos_idunid_vlr
    ON public.empenhos (cnpjraiz, idunid, vlr_empenhado);

-- Versao CONCURRENTLY para ambientes com carga (rode fora de transacao):
-- CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_variabilidade_cache_key
--     ON public.variabilidade_cache (group_by, group_key, cnpjraiz, min_n, mode);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_variabilidade_cache_computed_at
--     ON public.variabilidade_cache (computed_at);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_empenho_embeddings_id_empenho
--     ON public.empenho_embeddings (id_empenho);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_empenhos_cnpjraiz_ente
--     ON public.empenhos (cnpjraiz, ente);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_empenhos_cnpjraiz_idunid
--     ON public.empenhos (cnpjraiz, idunid);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_empenhos_ente_dtempenho
--     ON public.empenhos (cnpjraiz, ente, dtempenho);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_empenhos_ente_vlr
--     ON public.empenhos (cnpjraiz, ente, vlr_empenhado);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_empenhos_idunid_dtempenho
--     ON public.empenhos (cnpjraiz, idunid, dtempenho);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_empenhos_idunid_vlr
--     ON public.empenhos (cnpjraiz, idunid, vlr_empenhado);
