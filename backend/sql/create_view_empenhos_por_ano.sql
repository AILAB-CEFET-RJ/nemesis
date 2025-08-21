-- Cria a view materializada com filtro por ano
CREATE MATERIALIZED VIEW IF NOT EXISTS empenhos_por_ano AS
SELECT ano,
       idempenho,
       idunid,
       elemdespesatce,
       vlr_empenhado,
       dtempenho,
       historico
FROM empenhos;

-- Índice para acelerar filtros por ano
CREATE INDEX IF NOT EXISTS idx_empenhos_ano
    ON empenhos_por_ano (ano);

-- Índice para acelerar buscas por unidade e elemento de despesa
CREATE INDEX IF NOT EXISTS idx_empenhos_unid_elem
    ON empenhos_por_ano (idunid, elemdespesatce);


-- Como rodar esse script
-- psql -h localhost -U nemesis -d empenhos -f backend/sql/create_view_empenhos_por_ano.sql

-- Para atualizar a view quando novos dados forem inseridos na tabela empenhos:
-- REFRESH MATERIALIZED VIEW empenhos_por_ano;