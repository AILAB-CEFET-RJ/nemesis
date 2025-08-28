# Configuração do Banco de Dados

Este documento descreve o processo de configuração de um banco de dados PostgreSQL, preparação do esquema e carga dos dados históricos de **Notas de Empenho** a partir do arquivo parquet (`tce_large.parquet`) utilizando Python e SQLAlchemy.

---

## 1. Instalação de pacotes necessários

Certifique-se de ter o PostgreSQL e as dependências Python instaladas.

### Pacotes do sistema (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib libpq-dev python3-dev -y
```

### Dependências Python

Adicione as seguintes linhas ao seu `requirements.txt` (já incluídas no repositório):

```txt
sqlalchemy
psycopg2-binary
python-dotenv
```

Depois instale-as:

```bash
pip install -r requirements.txt
```

---

## 2. Inicialização do PostgreSQL

Habilite e inicie o serviço do PostgreSQL:

```bash
sudo systemctl start postgresql@14-main
sudo systemctl enable postgresql@14-main
```

Verifique o status:

```bash
sudo systemctl status postgresql@14-main
```

Você deve ver `active (running)`.

---

## 3. Criação do usuário e banco de dados

Entre no PostgreSQL como superusuário:

```bash
sudo -u postgres psql
```

No prompt, crie o usuário e o banco:

```sql
CREATE USER nemesis WITH PASSWORD 'sua_senha_forte';
CREATE DATABASE empenhos OWNER nemesis;
GRANT ALL PRIVILEGES ON DATABASE empenhos TO nemesis;
\q
```

---

## 4. Configuração do ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
POSTGRES_USER=nemesis
POSTGRES_PASSWORD=sua_senha_forte
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=empenhos
```

---

## 5. Preparação dos dados

O arquivo parquet deve estar dentro da pasta `backend/data/`:

```
backend/data/tce_large.parquet
```

Este arquivo contém aproximadamente 1,48 milhão de linhas de empenhos com 66 colunas.

---

## 6. Carga dos dados no PostgreSQL

Execute o script Python:

```bash
python load_empenhos.py
```

O script irá:

1. Ler o arquivo parquet em um DataFrame Pandas.  
2. Remover duplicatas no campo `idempenho`.  
3. Normalizar os nomes das colunas para minúsculas.  
4. Converter campos de data e numéricos.  
5. Criar a tabela `empenhos` com o esquema adequado (usando tipos seguros como `varchar` para CNPJ/CPF e `numeric` para valores monetários).  
6. Inserir os registros em lotes de 5.000 linhas com log de progresso.  
7. Criar índices nos campos de uso frequente (`ano`, `cpfcnpjcredor`, `nrlicitacao`).  

---

## 7. Verificação da carga

Após a execução, conecte-se ao banco:

```bash
psql -h localhost -U nemesis -d empenhos
```

E rode os comandos:

```sql
-- Contar linhas
SELECT COUNT(*) FROM empenhos;

-- Inspecionar alguns registros
SELECT idempenho, ano, credor, vlr_empenho
FROM empenhos
LIMIT 5;
```

---

## 8. Observações

- Identificadores administrativos (`idorgao`, `idcontrato`, etc.) foram ajustados para `bigint` ou `numeric` para evitar overflow.  
- CNPJs e CPFs são armazenados como `varchar` para preservar zeros à esquerda.  
- Valores monetários usam `numeric(18,2)` para precisão.  
