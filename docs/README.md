## Índice de Documentação

- [DATABASE_SETUP.md](DATABASE_SETUP.md): criação e carga inicial do banco de dados PostgreSQL com os empenhos.  
- [EMBEDDINGS_SETUP.md](EMBEDDINGS_SETUP.md): geração e armazenamento dos embeddings no banco (pgvector).  
- [VIEWS_SETUP.md](VIEWS_SETUP.md): criação da view materializada `empenhos_por_ano` para consultas otimizadas.


## Instruções Rápidas

### 1. Criar e popular o banco de dados
```bash
cd backend
python load_empenhos.py
```

* Lê o arquivo parquet da pasta data/.
* Cria a tabela empenhos no PostgreSQL.
* Insere os registros no banco.

### 2. Gerar e armazenar embeddings

```bash
cd backend
python generate_embeddings.py
```

* Usa o modelo `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`.
* Cria a tabela `empenho_embeddings` com tipo `vector(384)` (pgvector).
* Gera embeddings para o campo `historico` e armazena no banco.

---

### 3. Criar a view materializada por ano

```bash
cd backend/sql
psql -h localhost -U nemesis -d empenhos -f create_view_empenhos_por_ano.sql
```

* Cria a view materializada `empenhos_por_ano`.
* Permite filtrar consultas por ano de forma otimizada.

---

### 4. Detectar possíveis fracionamentos

Existem dois scripts para análise:

#### Pares de empenhos semelhantes

```bash
cd backend
python detect_fracionamento_pares.py
```

* Verifica pares de empenhos dentro de uma janela temporal (`JANELA_DIAS`).
* Usa similaridade de embeddings do campo `historico`.
* Gera um arquivo `suspeitas_fracionamento.csv`.

#### Grupos de empenhos semelhantes

```bash
cd backend
python detect_fracionamento_grupos.py
```

* Agrupa empenhos por (`idunid`, `elemdespesatce`).
* Detecta clusters de empenhos com valores abaixo do limiar (`VALOR_LIMIAR`) e históricos semelhantes.
* Também gera `suspeitas_fracionamento.csv`.

