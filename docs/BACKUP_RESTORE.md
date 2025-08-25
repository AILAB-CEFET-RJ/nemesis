# Backup e Restauração do Banco de Dados PostgreSQL

Este documento descreve como gerar um **dump** do banco de dados PostgreSQL e restaurá-lo em outra máquina.

---

## 1. Gerar Backup (Dump)

Na máquina de origem, execute:

```bash
pg_dump -h localhost -U nemesis -d empenhos -F c -b -v -f backup_empenhos.dump
```

### Parâmetros:
- `-h localhost` → host do servidor PostgreSQL  
- `-U nemesis` → usuário  
- `-d empenhos` → nome do banco  
- `-F c` → formato *custom* (recomendado)  
- `-b` → inclui blobs (se houver)  
- `-v` → modo verboso (mostra progresso)  
- `-f` → nome do arquivo de saída  

O arquivo `backup_empenhos.dump` será gerado no diretório atual.

---

## 2. Transferir o Backup para Outra Máquina

Use `scp`, pendrive ou outro meio para copiar o arquivo:

```bash
scp backup_empenhos.dump usuario@destino:/home/usuario/
```

---

## 3. Preparar a Máquina de Destino

### Instalar PostgreSQL
No Ubuntu/Debian:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

Certifique-se que a versão seja compatível com a da máquina de origem.

### Criar Usuário e Banco
Entre no Postgres como `postgres`:

```bash
sudo -u postgres psql
```

E execute:

```sql
CREATE USER nemesis WITH PASSWORD 'nemesis';
CREATE DATABASE empenhos OWNER nemesis;
GRANT ALL PRIVILEGES ON DATABASE empenhos TO nemesis;
\q
```

Se o projeto usa extensões (ex.: **pgvector**), habilite:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 4. Restaurar o Backup

Na máquina de destino:

```bash
pg_restore -h localhost -U nemesis -d empenhos -v backup_empenhos.dump
```

Digite a senha do usuário `nemesis` quando solicitado.

---

## 5. Verificar Restauração

Entre no banco:

```bash
psql -h localhost -U nemesis -d empenhos
```

E rode alguns comandos de checagem:

```sql
\dt     -- lista tabelas
\dm     -- lista materialized views
SELECT COUNT(*) FROM empenhos;
```

---

## Resumo

1. Gerar dump com `pg_dump`.  
2. Copiar o arquivo para a máquina destino.  
3. Instalar PostgreSQL e criar usuário/banco.  
4. Restaurar com `pg_restore`.  
5. Validar tabelas, views e dados.

---
