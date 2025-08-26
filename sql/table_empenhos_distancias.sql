--
-- idempenho_1 < idempenho_2 → para evitar duplicatas e manter simetria.
-- similaridade = cosseno entre embeddings.
-- Índices já na PK ajudam nas consultas.
--
-- Como rodar esse script
-- psql -h localhost -U nemesis -d empenhos -f sql/create_table_empenhos_distancias.sql
--

-- Apaga a tabela se já existir
DROP TABLE IF EXISTS empenho_distancias;

-- Cria a tabela com a definição correta
CREATE TABLE empenho_distancias (
    ente VARCHAR NOT NULL,
    idunid VARCHAR NOT NULL,
    ano INT NOT NULL,
    elemdespesatce VARCHAR NOT NULL,
    idempenho_1 VARCHAR NOT NULL,
    idempenho_2 VARCHAR NOT NULL,
    similaridade FLOAT NOT NULL,
    PRIMARY KEY (ente, idunid, ano, elemdespesatce, idempenho_1, idempenho_2)
);

-- Índice auxiliar para acelerar consultas por grupo
CREATE INDEX idx_empenho_distancias_grupo
    ON empenho_distancias (ano, ente, idunid, elemdespesatce);
