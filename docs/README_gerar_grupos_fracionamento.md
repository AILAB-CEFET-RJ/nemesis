# Script: gerar_grupos_fracionamento.py

Este script do **NEMESIS** sinaliza indícios de fracionamento de despesas em notas de empenho. Ele aponta agrupamentos suspeitos (não é conclusão de irregularidade).

---

## Como funciona
1) **Seleção por ano e datas**  
   - Parâmetro `--ano`; busca na tabela `empenhos` apenas no intervalo (`--data_inicio`, `--data_fim`, defaults 01/01–31/12 do ano).
2) **Filtro de valor**  
   - Mantém empenhos abaixo de `--valor_limiar` (default 8000).
3) **Similaridade + janela temporal**  
   - Para cada jurisdicionado (`ente`, `idunid`) e elemento (`elemdespesatce`), liga empenhos parecidos usando distâncias pré-computadas em `empenho_distancias`, filtradas por `--sim_limiar`.  
   - Só conecta pares dentro de `--janela_dias` (default 60) entre as datas dos empenhos.
4) **Clusters suspeitos**  
   - Componentes conexos com pelo menos `--min_cluster` empenhos e soma acima de `--valor_limiar` recebem um `cluster_id` global.

---

## Saída
Gera um `.parquet` (default) com colunas como:
- `cluster_id`, `cluster_size`, `soma_cluster`, `min_sim`, `max_sim`
- `ano`, `ente`, `idunid`, `elemdespesatce`
- `idempenho`, `data`, `valor`, `historico`, `credor`

Se não estiver vazio, grava também na tabela `clusters_fracionamento` (limpa o ano antes de inserir).

---

## Uso típico
```bash
cd backend
python auditoria/gerar_grupos_fracionamento.py \
  --ano 2019 \
  --valor_limiar 8000 \
  --janela_dias 60 \
  --sim_limiar 0.85 \
  --min_cluster 3 \
  --saida suspeitas_fracionamento.parquet
```

O backend agora lê diretamente Parquet. CSV é opcional (fallback) em `backend/data/fracionamento/suspeitas_fracionamento_<ano>.csv`, se quiser manter compatibilidade:
```bash
python - <<'PY'
import pandas as pd
df = pd.read_parquet("suspeitas_fracionamento_2019.parquet")
df.to_csv("data/fracionamento/suspeitas_fracionamento_2019.csv", index=False)
print("Linhas:", len(df))
PY
```
Depois reinicie o backend/redeploy para recarregar o arquivo.

---

## Observações
- Ajuste `--valor_limiar`, `--janela_dias`, `--sim_limiar`, datas e `--min_cluster` conforme norma vigente.
- Depende de credenciais Postgres no ambiente (`POSTGRES_*`) para ler empenhos e distâncias.
