# Geração e Armazenamento de Embeddings dos Empenhos

Este documento descreve o processo de criação e armazenamento dos **embeddings do campo `historico`** da base de empenhos, utilizando o modelo de linguagem `paraphrase-multilingual-MiniLM-L12-v2` e a extensão **pgvector** do PostgreSQL.

---

## 1. Dependências necessárias

### Pacotes do sistema
É necessário instalar pacotes de desenvolvimento do PostgreSQL para compilar e instalar a extensão `pgvector`:

```bash
sudo apt update
sudo apt install -y git make gcc postgresql-server-dev-14
```

### Instalação manual do pgvector
Clone o repositório oficial e instale a extensão:

```bash
git clone --branch v0.7.4 https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

Ative a extensão no banco de dados `empenhos`:

```bash
sudo -u postgres psql -d empenhos -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

Verifique se a instalação funcionou:

```sql
\dx
```

Deve aparecer algo como:

```
  Name   | Version |   Schema   | Description
---------+---------+------------+-----------------------------------------
 vector  | 0.7.4   | public     | vector data type and ivfflat and hnsw access methods
```

---

## 2. Dependências Python

No ambiente virtual, instale as seguintes bibliotecas:

```bash
pip install sqlalchemy psycopg2-binary pandas sentence-transformers
```

> Observação: a primeira execução do `sentence-transformers` fará o download automático do modelo `paraphrase-multilingual-MiniLM-L12-v2`.

---

## 3. Estrutura da tabela de embeddings

O script criará automaticamente a tabela `empenho_embeddings`:

```sql
create table if not exists empenho_embeddings (
    idempenho varchar primary key,
    embedding vector(384)
);
```

---

## 4. Execução do script

O script `generate_embeddings.py` percorre os registros da tabela `empenhos`, gera embeddings para o campo `historico` e os armazena na tabela `empenho_embeddings`.

### Execução

```bash
python generate_embeddings.py
```

O script funciona em lotes de 128 registros por vez e exibe o progresso.  
Na primeira execução, todos os registros serão processados (~1,48 milhão).  
Execuções subsequentes só processarão novos registros ainda sem embeddings.

---

## 5. Resultado

- Tabela `empenho_embeddings` preenchida com `idempenho` e o vetor `embedding`.  
- Embeddings prontos para uso em consultas semânticas.

