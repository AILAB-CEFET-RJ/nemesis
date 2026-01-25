# ![NEmesis](frontend/react/src/assets/logo.png) NEmesis — Notas de EMPenho com Estratégia Semântica e Inteligência de Sistemas

Plataforma de auditoria pública que combina busca semântica, filtros estruturados e módulos analíticos (sobrepreço, fracionamento, variabilidade semântica) para apoiar a investigação de despesas públicas. Projeto em parceria entre **TCE-RJ** e **CEFET/RJ**.

![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)
![React](https://img.shields.io/badge/React-19+-61DAFB.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg)
![pgvector](https://img.shields.io/badge/pgvector-enabled-5A4FCF.svg)

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [Audit Workflows](#-audit-workflows)
- [Modules](#-modules)
- [Examples](#-examples)
- [Project Structure](#-project-structure)
- [Security & Permissions](#-security--permissions)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core Capabilities
- **Busca semântica de empenhos** com embeddings e PostgreSQL + pgvector
- **Filtros estruturados** por município, jurisdicionado, elemento de despesa e credor
- **Módulos analíticos**: sobrepreço, fracionamento e variabilidade semântica
- **Visualização 3D** de itens de empenho com interação e painel de detalhes
- **Rerank opcional com LLM** para priorização dos resultados
- **Autenticação e autorização** por papéis e permissões

### Production Features
- API REST com **FastAPI**
- CORS configurável por ambiente
- Logs com rotação de arquivo
- Dockerfiles para frontend e backend
- Reverse proxy com **Caddy** servindo `/nemesis`

---

## 🏗️ Architecture

### System Overview

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP
       │
┌──────▼─────────────────────────────────────┐
│              Caddy (proxy)                  │
│  /nemesis → frontend (estático)            │
│  /nemesis/api → backend (FastAPI)          │
└───────────────┬────────────────────────────┘
                │
┌───────────────▼────────────────────────────┐
│              FastAPI Backend                │
│  • consulta_vs • sobrepreco • fracionamentos│
│  • variabilidade_semantica • auth/admin     │
└───────────────┬────────────────────────────┘
                │
┌───────────────▼────────────────────────────┐
│        PostgreSQL + pgvector                │
│  • embeddings • empenhos • análises         │
└────────────────────────────────────────────┘
```

### Retrieval & Ranking (Consulta de Empenhos)

```
Consulta do Auditor
       │
       ▼
Filtros estruturados + histórico
       │
       ▼
Busca semântica (pgvector)
       │
       ▼
Rerank (opcional, LLM)
       │
       ▼
Resultados ordenados
```

---

## 🚀 Installation

### Prerequisites
- **Python 3.11+**
- **Node.js 20+**
- **PostgreSQL 15+** com extensão **pgvector**
- **Docker** (opcional, recomendado para stack completa)

### Step 1: Clone the Repository

```bash
git clone <url-do-repo>
cd nemesis
```

### Step 2: Backend (local)

```bash
conda create -n nemesis python=3.11.13
conda activate nemesis
pip install -r backend/requirements.txt

cd backend
python -m uvicorn main:app --reload
```

### Step 3: Frontend (local)

```bash
cd frontend/react
npm install
npm start
```

Acesse: `http://localhost:3000` (modo dev)  
Deploy padrão: `http://localhost:8080/nemesis`

---

## ⚙️ Configuration

### Environment Variables (exemplo)

Crie um `.env` (ex.: `deploy/.env`) com:

```bash
# Banco
POSTGRES_HOST=host.docker.internal
POSTGRES_PORT=5432
POSTGRES_USER=nemesis
POSTGRES_PASSWORD=nemesis
POSTGRES_DB=empenhos

# API base (frontend via Caddy)
REACT_APP_API_BASE_URL=http://localhost:8080/nemesis

# LLM (opcional)
CONSULTA_LLM_RERANK=1
CONSULTA_RERANK_ALPHA=0.9
OPENAI_API_KEY=sk-***
OPENAI_FILTER_MODEL=gpt-4o-mini

# Auth
JWT_SECRET=change-me

# CORS
CORS_ORIGINS=http://localhost:8080,http://localhost:3000
```

### Model & Data Configuration

Arquivo `backend/config.yaml`:

```yaml
embedding_model: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
parquet_path: data/tce.parquet
```

---

## 📖 Usage

### Starting the stack with Docker

```bash
docker compose -f deploy/docker-compose.yml up -d --build
```

- Frontend: `http://localhost:8080/nemesis`
- API: `http://localhost:8080/nemesis/api`
- Backend direto (dev): `http://localhost:8000`

### Swagger / ReDoc

- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

---

## 🔌 API Reference

### Auth
- `POST /auth/login` — login
- `GET /auth/me` — usuário atual

### Consulta e análise
- `POST /api/consulta_vs` — consulta semântica de empenhos
- `POST /api/auto-filling` — preenchimento automático de filtros
- `POST /api/fracionamentos` — análise de fracionamento
- `GET /api/sobrepreco` — análise de sobrepreço
- `GET /api/variabilidade-semantica` — análise de variabilidade
- `GET /api/variabilidade-semantica/empenhos` — detalhes por empenho
- `GET /api/empenhos/{idempenho}` — detalhe do empenho

### Visualização 3D
- `POST /api/empenhos-3d` — dataset para visualização 3D

### Administração
- `GET /admin/users` / `POST /admin/users` / `PUT /admin/users/{user_id}`
- `GET /admin/roles`
- `GET /admin/permissions`

---

## 🔍 Audit Workflows

### 1) Consulta de Empenhos
- Combine **filtros estruturados** + **histórico**
- Rerank opcional com LLM
- Resultados ordenados por similaridade

### 2) Sobrepreço
- Filtra um conjunto de empenhos similares
- Compara com estatísticas do grupo de referência
- Aplica filtro inteligente (LLM) quando habilitado

### 3) Fracionamento
- Agrega ocorrências por município/jurisdicionado/ano
- Destaca suspeitas por padrões de repetição

### 4) Consistência Semântica
- Compara variações semânticas entre descrições e padrões esperados
- Ajuda a identificar desvios na linguagem do histórico

---

## 🧰 Modules

- **Consulta Semântica** (`/query`)
- **Sobrepreço** (`/sobrepreco`)
- **Fracionamento** (`/fracionamento`)
- **Visualização 3D** (`/visualizacao3d`)
- **Admin** (`/admin`)

---

## 💡 Examples

### Consulta básica

```bash
curl -X POST "http://localhost:8000/api/consulta_vs" \
  -H "Content-Type: application/json" \
  -d '{
    "ente": "NITEROI",
    "unidade": "PGM",
    "elementoDespesa": "",
    "credor": "",
    "historico": "água mineral"
  }'
```

### Sobrepreço

```bash
curl "http://localhost:8000/api/sobrepreco?ano=2019&descricao=água%20mineral"
```

---

## 📁 Project Structure

```
nemesis/
├── backend/                 # FastAPI + rotas de análise
├── frontend/react/          # UI em React + Tailwind
├── deploy/                  # Dockerfiles + Caddyfile
├── docs/                    # Documentação complementar
├── sql/                     # Scripts e dumps SQL
└── README.md                # Este arquivo
```

---

## 🔒 Security & Permissions

- **JWT** para autenticação
- **Permissões por módulo** (consulta, sobrepreço, fracionamento, admin)
- **CORS configurável** via `CORS_ORIGINS`

---

## 🚀 Deployment

### Docker (recomendado)

```bash
docker compose -f deploy/docker-compose.yml up -d --build
```

### Build separado

```bash
docker build -f deploy/Dockerfile.backend -t nemesis-backend .
docker build -f deploy/Dockerfile.frontend -t nemesis-frontend \
  --build-arg REACT_APP_API_BASE_URL=http://localhost:8000 .
```

---

## 🐛 Troubleshooting

**1. Erro de conexão com o banco**
- Confirme `POSTGRES_HOST/PORT` e se o `pgvector` está habilitado.

**2. Frontend não encontra API**
- Verifique `REACT_APP_API_BASE_URL` e o proxy do Caddy.

**3. LLM filter não funciona**
- Cheque `OPENAI_API_KEY` e `CONSULTA_LLM_RERANK=1`.

---

## 🤝 Contributing

1. Fork do repositório
2. Crie uma branch (`git checkout -b feature/minha-melhoria`)
3. Commit (`git commit -m 'Minha melhoria'`)
4. Push (`git push origin feature/minha-melhoria`)
5. Abra um Pull Request

---

## 📄 License

MIT License — ver `LICENSE`.

---

## Créditos

Projeto desenvolvido por **CEFET/RJ** em parceria com o **Tribunal de Contas do Estado do Rio de Janeiro (TCE-RJ)**.
