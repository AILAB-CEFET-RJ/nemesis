# 🛠️ Scripts de Auditoria — NEMESIS

Esta pasta reúne os **scripts utilitários de auditoria** do projeto NEMESIS.  
Cada script tem como função **sinalizar indícios** (e não detectar de forma conclusiva) de possíveis irregularidades em notas de empenho.  
O objetivo é **apoiar os auditores do TCE-RJ** na priorização de casos que merecem análise mais detalhada.

---

## 📂 Scripts disponíveis

### 1. `gerar_grupos_fracionamento.py`

**Objetivo**  
Sinaliza possíveis indícios de **fracionamento de despesas**, quando várias notas pequenas podem estar sendo usadas para escapar do processo de licitação.

**Como funciona**  
- Agrupa empenhos por **ente, unidade e elemento de despesa**.  
- Aplica filtro de valor (ex.: ≤ R$ 8.000).  
- Sinaliza quando há múltiplos empenhos semelhantes no mesmo período.  

**Exemplo de uso**  
```bash
python gerar_grupos_fracionamento.py --ano 2022 --saida fracionamentos_2022.parquet
````

**Saída**
Arquivo `.parquet` contendo:

* idempenho(s) relacionados
* ente/unidade
* valor empenhado
* flag de risco de fracionamento

Obs.: o backend consome diretamente o Parquet; a conversão para CSV é apenas opcional para compatibilidade legada.

---

### 2. `sinalizar_sobrepreco_intermunicipal.py`

**Objetivo**
Sinaliza possíveis indícios de **sobrepreço** comparando um empenho pivot com empenhos semanticamente semelhantes de **outras prefeituras** no mesmo ano.

**Como funciona**

* Recebe um `idempenho` de referência.
* Usa embeddings armazenados no banco (pgvector) para encontrar empenhos semelhantes.
* Calcula estatísticas (mediana, quartis, IQR).
* Sinaliza quando o valor do pivot está muito acima do padrão do grupo.

**Exemplo de uso**

```bash
python sinalizar_sobrepreco_intermunicipal.py \
    --idempenho 201800360179100010000001127 \
    --ano 2018 \
    --max_dist 0.32 \
    --limite 200
```

**Saída**
Resumo no console + DataFrame com os vizinhos recuperados:

* mediana estadual do grupo
* Q1, Q3, IQR
* desvio percentual do pivot
* flag de sobrepreço (`True/False`)

---

## 📌 Convenção de nomes

Todos os scripts seguem a convenção:

```
sinalizar_<tipo_de_indicio>.py
```

Isso reflete a função principal: **sinalizar indícios de risco**, deixando claro que a decisão final cabe ao auditor.

---

## 🔮 Próximos scripts (exemplos possíveis)

* `sinalizar_fornecedor_recorrente.py` — identificar fornecedores concentrando contratos.
* `sinalizar_anomalias_contratuais.py` — destacar contratos atípicos em termos de prazo/valor.
* `sinalizar_irregularidades_licitacao.py` — avaliar padrões suspeitos em licitações.

---

## ⚙️ Dependências comuns

Todos os scripts usam:

* **Python 3.9+**
* Bibliotecas: `pandas`, `sqlalchemy`, `psycopg2-binary`, `sentence-transformers` (quando necessário)

Instalação recomendada:

```bash
pip install -r requirements.txt
```
