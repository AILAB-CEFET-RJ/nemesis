# NEMESIS — Notas de EMPenho com Estratégia Semântica e Inteligência de Sistemas

O **NEMESIS** é um sistema desenvolvido em parceria entre o **TCE-RJ** e o **CEFET/RJ**, com o objetivo de **aprimorar a análise de notas de empenho** por meio de técnicas de **Processamento de Linguagem Natural (PLN)**, **Aprendizado de Máquina** e **busca semântica**.

A solução integra uma interface web para os auditores e um backend conectado a um banco de dados **PostgreSQL com pgvector**, permitindo:

- **Busca semântica de empenhos** com base no histórico textual  
- **Sinalização de possíveis irregularidades** (ex.: fracionamento, sobrepreço)  
- **Agrupamento e comparação de despesas** entre diferentes prefeituras  
- **Ferramentas de priorização de auditoria**  

---

## Estrutura do repositório

```

nemesis/
│
├── frontend/        # Interface web (React)
│   └── README.md    # instruções específicas do frontend
│
├── backend/         # Backend em Python (scripts + API)
│   ├── scripts/     # scripts de auditoria e análise
│   └── README.md    # instruções específicas do backend
│
├── docs/            # documentação complementar
│   └── SCRIPTS.md   # detalhamento dos scripts Python
│
└── README.md        # este arquivo (visão geral do projeto)

````

---

## Como começar

### 1. Configurar banco de dados
- Requer **PostgreSQL 15+** com extensão **pgvector** habilitada.  
- Scripts de criação de tabelas e views estão disponíveis em `backend/sql/`.  
- Após carregar os dados de empenhos, crie o índice para acelerar buscas semânticas:

```sql
CREATE INDEX IF NOT EXISTS idx_empenho_embeddings_cosine
ON empenho_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

ANALYZE empenho_embeddings;
````

### 2. Rodar backend

Veja instruções em [backend/README.md](./backend/README.md).

### 3. Rodar frontend

Veja instruções em [frontend/README.md](./frontend/README.md).

---

## 📖 Documentação

* [ Documentação dos Scripts Python](./docs/SCRIPTS.md)
* [ Backend](./backend/README.md)
* [ Frontend](./frontend/README.md)

---

## Créditos

Projeto desenvolvido por **CEFET/RJ** em parceria com o **Tribunal de Contas do Estado do Rio de Janeiro (TCE-RJ)**.
Fase atual: **desenvolvimento e validação**.

---
