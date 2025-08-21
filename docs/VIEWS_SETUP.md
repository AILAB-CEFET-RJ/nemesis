# Configuração de View Materializada por Ano

Este documento descreve o processo de criação e utilização de uma **view materializada** para segmentar os empenhos por ano.  
Essa abordagem garante que a análise de fracionamento (pares ou grupos) seja realizada **apenas dentro do mesmo exercício orçamentário**.

---

## Objetivo

- Respeitar o princípio orçamentário da **anualidade**, evitando que grupos de empenhos atravessem dois exercícios diferentes.  
- Melhorar a **performance** ao reduzir o volume de dados processado por vez.  
- Simplificar consultas SQL e scripts Python, evitando a necessidade de criar várias views por ano.

---

## Script de Criação

O script SQL de criação da view materializada pode ser salvo, por exemplo, em `backend/sql/create_view_empenhos_por_ano.sql`:

```sql
-- Cria a view materializada com filtro por ano
CREATE MATERIALIZED VIEW IF NOT EXISTS empenhos_por_ano AS
SELECT ano,
       idempenho,
       idunid,
       elemdespesatce,
       vlr_empenhado,
       dtempenho,
       historico
FROM empenhos;

-- Índice para acelerar filtros por ano
CREATE INDEX IF NOT EXISTS idx_empenhos_ano
    ON empenhos_por_ano (ano);

-- Índice para acelerar buscas por unidade e elemento de despesa
CREATE INDEX IF NOT EXISTS idx_empenhos_unid_elem
    ON empenhos_por_ano (idunid, elemdespesatce);
```

---

## Execução do Script

Para executar o script, use o comando:

```bash
psql -h localhost -U nemesis -d empenhos -f backend/sql/create_view_empenhos_por_ano.sql
```

- `-h localhost` → host do Postgres  
- `-U nemesis` → usuário  
- `-d empenhos` → banco de dados  
- `-f ...` → caminho para o arquivo SQL  

Será solicitada a senha do usuário `nemesis`.

---

## Atualização da View

Sempre que novos dados forem carregados no banco, é necessário atualizar a view:

```sql
REFRESH MATERIALIZED VIEW empenhos_por_ano;
```

---

## Uso nos Scripts Python

A consulta deve apontar para a view em vez da tabela original:

```python
query = text("""
    SELECT e.idempenho, e.idunid, e.elemdespesatce, e.vlr_empenhado,
           e.dtempenho, emb.embedding
    FROM empenhos_por_ano e
    JOIN empenho_embeddings emb ON e.idempenho = emb.idempenho
    WHERE e.vlr_empenhado < :limite
      AND e.ano = :ano
    ORDER BY e.idunid, e.elemdespesatce, e.dtempenho
""")
```

E no `params` basta informar o ano desejado:

```python
params = {"limite": VALOR_LIMIAR, "ano": 2024}
```

---

## Benefícios

- **Corretude**: respeita a lógica do orçamento anual.  
- **Eficiência**: menos dados em memória → menor risco de estouro de RAM.  
- **Flexibilidade**: basta alterar o parâmetro `ano` no script.  

---
