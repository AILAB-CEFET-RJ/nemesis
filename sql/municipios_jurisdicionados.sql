DO $$
DECLARE
    has_empenhos BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'empenhos'
    ) INTO has_empenhos;

    IF NOT has_empenhos THEN
        RAISE NOTICE 'Tabela empenhos não encontrada; pulando script municipios_jurisdicionados.';
        RETURN;
    END IF;

    -- ==============================================
    -- 1. Criar tabela municipios
    -- ==============================================
    CREATE TABLE IF NOT EXISTS municipios (
        id SERIAL PRIMARY KEY,
        nome TEXT UNIQUE NOT NULL
    );

    INSERT INTO municipios (nome)
    SELECT DISTINCT ente
    FROM empenhos
    WHERE ente IS NOT NULL
    ORDER BY ente
    ON CONFLICT (nome) DO NOTHING;

    -- ==============================================
    -- 2. Criar tabela jurisdicionados
    -- ==============================================
    CREATE TABLE IF NOT EXISTS jurisdicionados (
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
    WHERE e.unidade IS NOT NULL
    ON CONFLICT DO NOTHING;

    -- ==============================================
    -- 3. Alterar tabela empenhos para adicionar FK
    -- ==============================================
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'empenhos'
          AND column_name = 'id_jurisdicionado'
    ) THEN
        ALTER TABLE empenhos
        ADD COLUMN id_jurisdicionado INT;
    END IF;

    UPDATE empenhos e
    SET id_jurisdicionado = j.id
    FROM jurisdicionados j
    JOIN municipios m ON j.id_municipio = m.id
    WHERE e.unidade = j.nome
      AND e.ente = m.nome;

    BEGIN
        ALTER TABLE empenhos
        ADD CONSTRAINT fk_jurisdicionado
        FOREIGN KEY (id_jurisdicionado) REFERENCES jurisdicionados(id);
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- constraint já existe
    END;

    -- ==============================================
    -- 4. Verificações de consistência
    -- ==============================================

    -- 4.1 Quantos empenhos ficaram sem jurisdicionado
    RAISE NOTICE 'Empenhos sem jurisdicionado: %',
        (SELECT COUNT(*) FROM empenhos WHERE id_jurisdicionado IS NULL);

    -- 4.2 Jurisdicionados sem empenhos vinculados (apenas aviso)
    RAISE NOTICE 'Jurisdicionados sem empenhos: %',
        (SELECT COUNT(*) FROM jurisdicionados j
         LEFT JOIN empenhos e ON e.id_jurisdicionado = j.id
         WHERE e.idempenho IS NULL);

END $$;
