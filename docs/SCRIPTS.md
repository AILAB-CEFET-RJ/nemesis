# Scripts de Análise de Empenhos

Este repositório contém scripts em Python desenvolvidos no âmbito do projeto **NEMESIS** (Notas de EMPenho com Estratégia Semântica e Inteligência de Sistemas), fruto da parceria entre o **TCE-RJ** e o **CEFET/RJ**.

Os scripts auxiliam na **detecção de indícios de sobrepreço** em notas de empenho e na **comparação intermunicipal** de despesas públicas, usando técnicas de **Processamento de Linguagem Natural** e **busca semântica via embeddings**.

---

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/seu-org/nemesis.git
cd nemesis

# Ambiente Python
python -m venv venv
source venv/bin/activate   # Linux/macOS
venv\Scripts\activate      # Windows

# Dependências
pip install -r requirements.txt
```
---

## Pré-requisitos

* **PostgreSQL** com extensão **pgvector** habilitada.
* Base de dados com a view `empenhos_por_ano` e tabela `empenho_embeddings`.
* Índice vetorial para acelerar buscas semânticas:

```sql
CREATE INDEX IF NOT EXISTS idx_empenho_embeddings_cosine
ON empenho_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

ANALYZE empenho_embeddings;
```

---

## Scripts disponíveis

### 1. `detectar_sobrepreco.py`

Identifica empenhos com indícios de **sobrepreço dentro da mesma prefeitura**.

* **Entrada**: ano
* **Saída**: arquivo Parquet com empenhos suspeitos
* **Critério**: valores acima de `Q3 + 1.5 × IQR` no grupo

**Exemplo de uso:**

```bash
python detectar_sobrepreco.py --ano 2022 --saida sobreprecos_2022.parquet
```

---

### 2. `comparar_empenho_vs_estado.py` (pseudocódigo inicial)


---

### 2. `comparar_empenho_pgvector.py`

Compara um **empenho pivot** contra empenhos semanticamente semelhantes de **outras prefeituras no mesmo ano**.

Esse script usa **pgvector no PostgreSQL** para busca semântica eficiente.

* **Entrada**: idempenho pivot + ano + parâmetros de busca (`max_dist`, `limite`)
* **Saída**:

  * resumo estatístico (mediana, IQR, desvio percentual, flag de sobrepreço)
  * DataFrame com vizinhos similares recuperados

**Exemplo de uso:**

```bash
python comparar_empenho_pgvector.py --idempenho 123456 --ano 2022 --max_dist 0.3 --limite 200
```

---

## Fluxo de análise

1. **Busca semântica**: o auditor seleciona um empenho de interesse (*pivot*).
2. **Comparação intermunicipal**: busca empenhos semelhantes em **outras prefeituras no mesmo ano**.
3. **Estatísticas**: cálculo da mediana estadual, IQR, desvio percentual.
4. **Sinalização**: se o pivot estiver muito acima, o sistema gera alerta de possível sobrepreço.

---

## Observações finais

* Estatísticas são calculadas em **Python (Pandas)** para maior flexibilidade.
* Busca semântica usa **pgvector** (`ivfflat`), garantindo desempenho mesmo em bases grandes (\~1,4M embeddings).
* As regras de sinalização são parametrizáveis (IQR, z-score, percentuais).
* Scripts podem ser usados em **modo interativo** (auditor) ou **batch** (relatórios periódicos).
