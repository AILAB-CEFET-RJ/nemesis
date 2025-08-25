# Detecção de Fracionamento de Compras

Este módulo implementa a lógica para **identificação de possíveis casos de fracionamento de empenhos**,
utilizando dados armazenados no banco PostgreSQL com extensão **pgvector**.

---

## Fluxo do script `detect_fracionamento.py`

1. Busca os empenhos no Postgres já com embeddings (tabela `empenho_embeddings`).
2. Filtra apenas os registros com `vlr_empenhado < VALOR_LIMIAR`.
3. Agrupa os dados por `(idunid, elemdespesatce)`.
4. Verifica pares de empenhos dentro de uma **janela temporal** (`JANELA_DIAS`).
5. Calcula a **similaridade de embeddings** entre os campos `historico`.
6. Salva os resultados em `suspeitas_fracionamento.csv`.

---

## Parâmetros ajustáveis

No script você pode alterar:

- `VALOR_LIMIAR` → valor máximo do empenho para análise (ex.: 50.000).
- `JANELA_DIAS` → intervalo de tempo considerado (ex.: 30, 60 ou 90 dias).
- `SIMILARIDADE_MINIMA` → limite mínimo de similaridade entre históricos (0 a 1).
- `BATCH_SIZE` → tamanho do lote para processamento em memória.

---

## Execução

Execute o script diretamente no Python:

```bash
python detect_fracionamento.py
```

Saída esperada:

```
Carregando empenhos...
Total de empenhos carregados: XXXXX
🚦 Detectando possíveis fracionamentos...
Total de pares suspeitos: YYYYY
Resultados salvos em suspeitas_fracionamento.csv
```

---

## Resultado

Um arquivo CSV contendo os pares de empenhos suspeitos, com as seguintes colunas:

- `idunid`  
- `elemdespesatce`  
- `idempenho_1`, `idempenho_2`  
- `vlr_1`, `vlr_2`  
- `dias_dif` (diferença de dias entre os empenhos)  
- `similaridade` (similaridade coseno entre os históricos)

---
