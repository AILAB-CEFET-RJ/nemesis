-- =====================================
-- Otimização para consultas frequentes
-- =====================================

-- 1. Índices para acelerar o JOIN em idempenho
CREATE INDEX IF NOT EXISTS idx_empenhos_ano_idempenho
    ON empenhos_por_ano (idempenho);

CREATE INDEX IF NOT EXISTS idx_empenho_embeddings_idempenho
    ON empenho_embeddings (idempenho);

-- 2. Índice composto para filtro (ano, vlr_empenhado)
--    e ordenação (idunid, elemdespesatce, dtempenho)
CREATE INDEX IF NOT EXISTS idx_empenhos_full
    ON empenhos_por_ano (ano, vlr_empenhado, idunid, elemdespesatce, dtempenho);

-- 3. Atualiza estatísticas para o otimizador
ANALYZE empenhos_por_ano;
ANALYZE empenho_embeddings;

-- =====================================
-- Nota sobre work_mem
-- =====================================
-- O parâmetro work_mem define a memória disponível
-- para operações de sort e hash em cada worker.
--
-- Exemplo para aumentar para 128MB na sessão atual:
--   SET work_mem = '128MB';
--
-- Ajuste permanente deve ser feito no postgresql.conf:
--   work_mem = '128MB'
--
-- Recomendado se houver consultas que geram muitos
-- registros e ordenações complexas.


-- =====================================
-- Como rodar esse script
-- =====================================
-- psql -h localhost -U nemesis -d empenhos -f backend/sql/optimize_queries.sql
