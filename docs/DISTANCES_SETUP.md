# Geração de Distâncias entre Empenhos

Este documento descreve o uso de [`backend/generate_distances.py`](../backend/generate_distances.py), que calcula similaridades entre empenhos com embeddings e grava os pares na tabela `empenho_distancias`.

---

## 1. Pré-requisitos

- Banco PostgreSQL com o schema atual aplicado a partir de [`sql/schema_dump.sql`](../sql/schema_dump.sql).
- Tabela `empenhos` carregada.
- Tabela `empenho_embeddings` preenchida por [`generate_embeddings.py`](../backend/generate_embeddings.py).
- Coluna `empenho_embeddings.id_empenho` preenchida.
- Variáveis de ambiente do PostgreSQL configuradas:

```bash
POSTGRES_USER=nemesis
POSTGRES_PASSWORD=...
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=nemesis
```

O script valida as tabelas e colunas esperadas antes de processar.

---

## 2. Tabela de Saída

O script grava em `public.empenho_distancias`:

```sql
CREATE TABLE public.empenho_distancias (
    ente character varying NOT NULL,
    idunid bigint NOT NULL,
    ano integer NOT NULL,
    elemdespesatce character varying NOT NULL,
    idempenho_1 character varying NOT NULL,
    idempenho_2 character varying NOT NULL,
    similaridade double precision NOT NULL,
    id_empenho_1 bigint,
    id_empenho_2 bigint,
    PRIMARY KEY (ente, idunid, ano, elemdespesatce, idempenho_1, idempenho_2)
);
```

`idempenho_1` e `idempenho_2` continuam sendo parte da chave primária. `id_empenho_1` e `id_empenho_2` guardam as referências numéricas para `empenhos.id`.

---

## 3. Comando Básico

Execute a partir da pasta `backend`:

```bash
cd backend
python generate_distances.py --anos 2019 2020 2021
```

Esse comando calcula todos os pares dentro de cada grupo:

```text
(ano, ente, idunid, elemdespesatce)
```

---

## 4. Janela Temporal

Para comparar apenas empenhos próximos no tempo:

```bash
python generate_distances.py --anos 2019 --janela_dias 60
```

Quando `--janela_dias` é informado:

- os empenhos do grupo são ordenados por `dtempenho`;
- pares com diferença maior que a janela são ignorados;
- empenhos sem `dtempenho` são ignorados nesse modo.

Quando `--janela_dias` é omitido, todos os pares do grupo são comparados.

---

## 5. Flags

| Flag | Descrição |
| --- | --- |
| `--anos` | Lista de anos a processar. Obrigatória. Ex.: `--anos 2019 2020`. |
| `--janela_dias` | Janela temporal máxima em dias. Se omitida, compara todos os pares. |
| `--limite_grupo` | Limita a quantidade de empenhos por grupo para teste/debug. |
| `--batch_size` | Quantidade de pares por inserção no banco. Padrão: `100000`. |
| `--block_size` | Tamanho dos blocos para cálculo de similaridade quando não há janela temporal. Padrão: `500`. |
| `--debug` | Mostra mensagens adicionais, incluindo grupos pulados. |
| `--skip_backfill_ids` | Não executa o backfill de `id_empenho_1` e `id_empenho_2` em linhas antigas. |

---

## 6. Checkpoint por Grupo

Antes de processar um grupo, o script verifica se já existe pelo menos uma linha em `empenho_distancias` para:

```text
(ano, ente, idunid, elemdespesatce)
```

Se existir, o grupo é pulado.

Isso evita reprocessamento acidental, mas exige cuidado: se você mudar a estratégia de cálculo, por exemplo de todos os pares para `--janela_dias 60`, limpe os grupos antigos antes de reprocessar.

Exemplo:

```sql
DELETE FROM public.empenho_distancias
WHERE ano = 2019;
```

---

## 7. Backfill de IDs

Por padrão, antes de processar novos grupos, o script tenta preencher referências numéricas em linhas antigas:

```sql
id_empenho_1
id_empenho_2
```

Esse backfill usa `idempenho_1` e `idempenho_2` para encontrar `empenhos.id`.

Para pular essa etapa:

```bash
python generate_distances.py --anos 2019 --skip_backfill_ids
```

---

## 8. Verificações Úteis

Verificar linhas sem referência numérica:

```sql
SELECT
    COUNT(*) FILTER (WHERE id_empenho_1 IS NULL) AS sem_id_1,
    COUNT(*) FILTER (WHERE id_empenho_2 IS NULL) AS sem_id_2
FROM public.empenho_distancias;
```

Verificar volume por ano:

```sql
SELECT ano, COUNT(*)
FROM public.empenho_distancias
GROUP BY ano
ORDER BY ano;
```

Verificar grupos já processados:

```sql
SELECT ano, ente, idunid, elemdespesatce, COUNT(*) AS pares
FROM public.empenho_distancias
GROUP BY ano, ente, idunid, elemdespesatce
ORDER BY ano, ente, idunid, elemdespesatce;
```

---

## 9. Scripts Legados

`precompute_distancias.py` foi removido. Seu caso de uso foi incorporado por:

```bash
python generate_distances.py --anos 2019 --janela_dias 60
```

`gerar_distancias_batch.py` foi renomeado para `generate_distances.py`.
