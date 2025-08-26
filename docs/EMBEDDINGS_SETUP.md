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

---

## 2. Estrutura da Tabela de Embeddings

O processo cria automaticamente a tabela **`empenho_embeddings`** no banco de dados:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS empenho_embeddings (
    idempenho varchar PRIMARY KEY,
    embedding vector(384),
    embedding_array float4[]
);
```

- **`embedding`** → Armazena o vetor no formato `vector(384)` do pgvector, permitindo consultas vetoriais no PostgreSQL.  
- **`embedding_array`** → Armazena o mesmo vetor como `float4[]`, para ser lido diretamente em Python sem necessidade de conversão lenta.

---

## 3. Geração dos Embeddings

O script [`backend/generate_embeddings.py`](../backend/generate_embeddings.py) faz:

1. Busca registros na tabela `empenhos` que ainda não possuem embedding.
2. Gera embeddings usando o modelo **`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`**.
3. Insere resultados na tabela `empenho_embeddings`.

### Execução

```bash
conda activate nemesis
python backend/generate_embeddings.py
```

Exemplo de saída esperada:

```
Registros a processar: 150000
Processado lote 0 - 128
Processado lote 128 - 256
...
Embeddings gerados e armazenados com sucesso!
```

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
