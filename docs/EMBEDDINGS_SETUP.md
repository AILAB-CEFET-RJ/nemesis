# Configuração de Geração e Armazenamento de Embeddings

Este documento descreve o processo de geração de embeddings a partir do campo **`historico`** da tabela `empenhos` e armazenamento no PostgreSQL com **pgvector**.

---

## 1. Pré-requisitos

Certifique-se de ter instalado:

- PostgreSQL 14+
- Extensão [pgvector](https://github.com/pgvector/pgvector) instalada no PostgreSQL.  
  Para habilitar a extensão, execute no terminal:
  ```bash
  sudo -u postgres psql -d empenhos
  ```
  E, dentro do prompt do PostgreSQL:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  \q
  ```
- Ambiente Conda/Python com os pacotes:
  ```bash
  pip install psycopg2-binary sqlalchemy pandas python-dotenv sentence-transformers
  ```

- **Arquivo `.env` configurado corretamente**:  
  Copie o arquivo `.env.example` para `.env` e ajuste as variáveis conforme seu ambiente:
  ```bash
  cp .env.example .env
  ```
  
  **Importante**: Configure `POSTGRES_HOST` de acordo com seu setup:
  - Use `"db"` se estiver rodando o PostgreSQL no Docker
  - Use `"localhost"` se estiver rodando o PostgreSQL localmente

---

## 2. Estrutura da Tabela de Embeddings

A tabela **`empenho_embeddings`** deve existir no banco antes da execução do script. O schema canônico está em [`sql/schema_dump.sql`](../sql/schema_dump.sql).

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE empenho_embeddings (
    idempenho character varying NOT NULL,
    embedding vector(384),
    embedding_reduced vector(3),
    embedding_array real[],
    id_empenho bigint,
    PRIMARY KEY (idempenho)
);
```

- **`embedding`** → Armazena o vetor no formato `vector(384)` do pgvector, permitindo consultas vetoriais no PostgreSQL.  
- **`embedding_reduced`** → Armazena o vetor reduzido para visualizações 3D.
- **`embedding_array`** → Armazena o mesmo vetor como `float4[]`, para ser lido diretamente em Python sem necessidade de conversão lenta.
- **`id_empenho`** → Referência ao identificador surrogate `empenhos.id`, usado por consultas novas do backend.

---

## 3. Geração dos Embeddings

O script [`backend/generate_embeddings.py`](../backend/generate_embeddings.py) faz:

1. Valida o schema esperado no PostgreSQL.
2. Preenche `empenho_embeddings.id_empenho` para embeddings antigos que ainda estejam sem essa referência.
3. Busca registros na tabela `empenhos` que ainda não possuem embedding.
4. Gera embeddings usando o modelo configurado em `backend/config.yaml`.
5. Insere resultados na tabela `empenho_embeddings`, incluindo `id_empenho`.

### Comando recomendado

Execute a partir da pasta `backend`, porque o script lê `config.yaml`, `.env` e `data/reduced_embeds.npy` por caminhos relativos:

```bash
conda activate nemesis
cd backend
python generate_embeddings.py
```

Também é possível executar a partir da raiz do repositório, ajustando o caminho do arquivo de embeddings reduzidos:

```bash
python backend/generate_embeddings.py \
  --reduced-embeds backend/data/reduced_embeds.npy
```

Para informar outro arquivo de embeddings reduzidos:

```bash
python generate_embeddings.py --reduced-embeds data/outro_arquivo.npy
```

### Flags disponíveis

| Flag | Descrição |
| --- | --- |
| `--framework` | Define o backend de geração: `huggingface` ou `mindspore`. Padrão: `huggingface`. |
| `--reduced-embeds` | Caminho para o `.npy` com embeddings reduzidos usados em `embedding_reduced`. Padrão: `data/reduced_embeds.npy`. |

Exemplos:

```bash
python generate_embeddings.py --framework huggingface
```

```bash
python generate_embeddings.py \
  --framework mindspore \
  --reduced-embeds data/reduced_embeds.npy
```

Exemplo de saída esperada:

```
Registros a processar: 150000
Processado lote 0 - 128
Processado lote 128 - 256
...
Embeddings gerados e armazenados com sucesso!
```

### Comportamento incremental

O script só processa empenhos que ainda não existem em `empenho_embeddings`, usando `NOT EXISTS` sobre `idempenho`. Antes de gerar novos embeddings, ele atualiza registros antigos que já tenham `idempenho`, mas ainda estejam com `id_empenho` nulo.

Se um registro for inserido simultaneamente por outro processo, o conflito em `idempenho` atualiza apenas `id_empenho`. Os vetores existentes não são substituídos automaticamente.

### Relação com `empenhos.id`

O schema atual usa `empenhos.id` como identificador surrogate. Por isso, o script grava:

- `empenho_embeddings.idempenho`: identificador textual original, ainda usado como chave primária da tabela;
- `empenho_embeddings.id_empenho`: referência numérica para `empenhos.id`, usada por rotas e consultas novas.

Após a execução, uma verificação útil é:

```sql
SELECT COUNT(*)
FROM empenho_embeddings
WHERE id_empenho IS NULL;
```

O resultado esperado é `0`, salvo embeddings órfãos cujo `idempenho` não exista mais em `empenhos`.

### Cuidados com `embedding_reduced`

O arquivo informado em `--reduced-embeds` precisa estar alinhado aos empenhos carregados. O script tenta usar `id_empenho - 1` como posição no array quando o arquivo possui tamanho suficiente; caso contrário, usa o alinhamento sequencial da consulta atual.

Se o arquivo `.npy` tiver sido gerado para outra ordem ou outra versão da base, `embedding_reduced` pode ficar inconsistente para visualizações 3D.

---

## 4. Fluxo de Uso

1. A aplicação consulta diretamente a tabela `empenho_embeddings`.  
2. Para análise em Python, utilize **`embedding_array`** (mais eficiente que `embedding`).  
3. Para consultas vetoriais dentro do Postgres (similaridade, busca por vizinhos, etc.), utilize a coluna **`embedding`**.

---

## 5. Exemplo de Consulta SQL

### Buscar os 5 embeddings mais semelhantes a um vetor arbitrário:

```sql
SELECT idempenho, embedding <-> '[0.1, 0.2, 0.3, ...]' AS distancia
FROM empenho_embeddings
ORDER BY embedding <-> '[0.1, 0.2, 0.3, ...]'
LIMIT 5;
```
