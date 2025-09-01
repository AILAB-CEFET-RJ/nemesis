# Comandos Úteis no psql

Este documento lista comandos básicos e úteis para navegar e inspecionar o banco de dados PostgreSQL usando o cliente interativo `psql`.

---

## Instalação e backup

- `pg_dump -h localhost -U nemesis -W -F c -b -v -f empenhos.dump empenhos`
  Gera um dump do estado atual bo Banco.

---

## Navegação e Metadados

- `\l`  
  Lista todos os bancos de dados.

- `\c nome_banco`  
  Conecta-se a um banco de dados específico.

- `\dt`  
  Lista todas as tabelas.

- `\dv`  
  Lista todas as views normais.

- `\dm`  
  Lista todas as views materializadas.

- `\dx`  
  Lista as extensões instaladas.

- `\du`  
  Lista os usuários (roles) existentes.

---

## Inspeção de Estruturas

- `\d nome_tabela`  
  Mostra a estrutura de uma tabela.

- `\d+ nome_tabela`  
  Mostra a estrutura com detalhes adicionais (inclui índices).

- `\d+ empenhos_por_ano`  
  Exemplo para ver detalhes da view materializada `empenhos_por_ano`.

---

## Consultas Rápidas

- `SELECT COUNT(*) FROM nome_tabela;`  
  Conta o número de registros.

- `SELECT * FROM nome_tabela LIMIT 10;`  
  Visualiza as primeiras linhas de uma tabela/view.

- `SELECT DISTINCT coluna FROM nome_tabela;`  
  Lista valores distintos de uma coluna.

- `SELECT * FROM empenhos_por_ano WHERE ano = 2024 LIMIT 10;`  
  Exemplo de consulta específica por ano.

---

## Atualização de Views Materializadas

- `REFRESH MATERIALIZED VIEW empenhos_por_ano;`  
  Atualiza a view materializada `empenhos_por_ano` após inserção de novos dados na tabela base.

---

## Saída

- `\q`  
  Sai do cliente `psql`.

---
