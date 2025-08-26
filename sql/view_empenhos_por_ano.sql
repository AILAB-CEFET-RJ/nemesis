-- ==================================================
-- Criação de view materializada empenhos_por_ano
-- Integrando embeddings diretamente
--
-- Como rodar esse script
-- psql -h localhost -U nemesis -d empenhos -f sql/create_view_empenhos_por_ano.sql

-- Para atualizar a view quando novos dados forem inseridos na tabela empenhos:
-- REFRESH MATERIALIZED VIEW empenhos_por_ano;

-- ==================================================

-- 1. Remove view materializada anterior
DROP MATERIALIZED VIEW IF EXISTS empenhos_por_ano;

-- 2. Cria a nova view materializada, já unindo empenhos + embeddings
CREATE MATERIALIZED VIEW empenhos_por_ano AS
SELECT 
    e.ano,
    e.idempenho,
    e.ente,
    e.idunid,
    e.elemdespesatce,
    e.credor,
    e.cnpjraiz,
    e.cpfcnpjcredorqtnrs,
    e.cpfcnpjcredor,
    e.vlr_empenhado,
    e.dtempenho,
    e.historico,
    e.nrlicitacao,
    e.idcontrato,
    emb.embedding,
    emb.embedding_array
FROM empenhos e
LEFT JOIN empenho_embeddings emb
    ON e.idempenho = emb.idempenho;

-- ==================================================
-- Índices para otimização
-- ==================================================

-- Índice para filtro por ano
CREATE INDEX idx_empenhos_ano
    ON empenhos_por_ano (ano);

-- Índice para JOIN/consultas por idempenho
CREATE INDEX idx_empenhos_idempenho
    ON empenhos_por_ano (idempenho);

-- Índice hierárquico para filtros por ente/unid/elem
-- e ordenação por data
CREATE INDEX idx_empenhos_ente_unid_elem_data
    ON empenhos_por_ano (ente, idunid, elemdespesatce, dtempenho);

-- Índice parcial para acelerar detecção de fracionamento
-- (apenas empenhos com valor abaixo do limiar)
CREATE INDEX idx_empenhos_valor_limiar
    ON empenhos_por_ano (ano, idunid, elemdespesatce, dtempenho)
    WHERE vlr_empenhado <= 8000;

-- ==================================================
-- Atualiza estatísticas
-- ==================================================
ANALYZE empenhos_por_ano;
ANALYZE empenho_embeddings;


