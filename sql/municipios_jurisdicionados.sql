-- ==============================================
-- 1. Criar tabela municipios
-- ==============================================
CREATE TABLE municipios (
    id SERIAL PRIMARY KEY,
    nome TEXT UNIQUE NOT NULL
);

INSERT INTO municipios (nome)
SELECT DISTINCT ente
FROM empenhos
WHERE ente IS NOT NULL
ORDER BY ente;

-- ==============================================
-- 2. Criar tabela jurisdicionados
-- ==============================================
CREATE TABLE jurisdicionados (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    id_municipio INT NOT NULL,
    CONSTRAINT fk_municipio FOREIGN KEY (id_municipio) REFERENCES municipios(id),
    CONSTRAINT uq_jurisdicionado UNIQUE (nome, id_municipio)
);

INSERT INTO jurisdicionados (nome, id_municipio)
SELECT DISTINCT e.unidade, m.id
FROM empenhos e
JOIN municipios m ON e.ente = m.nome
WHERE e.unidade IS NOT NULL;

-- ==============================================
-- 3. Alterar tabela empenhos para adicionar FK
-- ==============================================
ALTER TABLE empenhos
ADD COLUMN id_jurisdicionado INT;

UPDATE empenhos e
SET id_jurisdicionado = j.id
FROM jurisdicionados j
JOIN municipios m ON j.id_municipio = m.id
WHERE e.unidade = j.nome
  AND e.ente = m.nome;

ALTER TABLE empenhos
ADD CONSTRAINT fk_jurisdicionado
FOREIGN KEY (id_jurisdicionado) REFERENCES jurisdicionados(id);

-- ==============================================
-- 4. Verificações de consistência
-- ==============================================

-- 4.1 Quantos empenhos ficaram sem jurisdicionado
SELECT COUNT(*) AS empenhos_sem_jurisdicionado
FROM empenhos
WHERE id_jurisdicionado IS NULL;

-- 4.2 Amostra de empenhos sem correspondência
SELECT idempenho, ente, unidade
FROM empenhos
WHERE id_jurisdicionado IS NULL
LIMIT 20;

-- 4.3 Jurisdicionados sem empenhos vinculados
SELECT j.id, j.nome, m.nome AS municipio
FROM jurisdicionados j
LEFT JOIN empenhos e ON e.id_jurisdicionado = j.id
JOIN municipios m ON j.id_municipio = m.id
WHERE e.idempenho IS NULL;

-- 4.4 Conferência do número de unidades por município
SELECT m.nome AS municipio,
       COUNT(DISTINCT e.unidade) AS unidades_empenhos,
       COUNT(DISTINCT j.nome) AS unidades_jurisdicionados
FROM municipios m
LEFT JOIN empenhos e ON e.ente = m.nome
LEFT JOIN jurisdicionados j ON j.id_municipio = m.id
GROUP BY m.nome
ORDER BY m.nome;

-- ==============================================
-- 5. (Opcional) Remover colunas redundantes
-- ==============================================
-- ALTER TABLE empenhos
-- DROP COLUMN ente,
-- DROP COLUMN unidade,
-- DROP COLUMN idunid;
