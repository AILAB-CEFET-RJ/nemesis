CREATE TABLE IF NOT EXISTS clusters_fracionamento (
    cluster_id       BIGINT,
    cluster_size     INT,
    soma_cluster     NUMERIC(18,2),
    min_sim          FLOAT,
    max_sim          FLOAT,
    ano              INT,
    ente             TEXT,
    idunid           BIGINT,
    elemdespesatce   TEXT,
    credor           TEXT,
    idempenho        VARCHAR,
    data             DATE,
    valor            NUMERIC(18,2),
    historico        TEXT,
    data_processamento TIMESTAMP DEFAULT now()
);
