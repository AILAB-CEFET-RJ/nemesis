import json
import logging
from logging.handlers import RotatingFileHandler
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from routes.auth_utils import require_permission
from routes.admin import router as admin_router
from routes.visualizacao3d import router as visualizacao3d_router
from routes.consulta_vs import router as consulta_vs_router
from routes.auto_filling import router as auto_filling
from routes.fracionamentos import router as fracionamentos
from routes.sobrepreco import router as sobrepreco_router
from routes.variabilidade_semantica import router as variabilidade_semantica_router
import yaml
from transformers import AutoTokenizer, AutoModel
from routes.db import engine

with open('config.yaml') as f:
    config = yaml.safe_load(f)
    
    
model_name = config['embedding_model']
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)
print('modelo carregado!')


# Logger de acesso com rotação em arquivo
access_logger = logging.getLogger("access")
access_logger.setLevel(logging.INFO)
if not access_logger.handlers:
    logs_dir = Path(__file__).resolve().parent / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    log_file = logs_dir / "access.log"
    handler = RotatingFileHandler(log_file, maxBytes=5 * 1024 * 1024, backupCount=3)
    formatter = logging.Formatter('%(message)s')
    handler.setFormatter(formatter)
    access_logger.addHandler(handler)


app = FastAPI()
# guardar o modelo e tokenizer no app.state
app.state.model = model
app.state.tokenizer = tokenizer


# Configurar CORS para permitir frontend local
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://aquarii.eic.cefet-rj.br").split(",")
allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas
app.include_router(auth_router)
app.include_router(admin_router, dependencies=[Depends(require_permission("admin.manage"))])
app.include_router(fracionamentos, dependencies=[Depends(require_permission("fracionamento.read"))])
app.include_router(visualizacao3d_router, dependencies=[Depends(require_permission("consulta.read"))])
app.include_router(consulta_vs_router, dependencies=[Depends(require_permission("consulta.read"))])
app.include_router(auto_filling, dependencies=[Depends(require_permission("consulta.read"))])
app.include_router(sobrepreco_router, dependencies=[Depends(require_permission("sobrepreco.read"))])
app.include_router(variabilidade_semantica_router, dependencies=[Depends(require_permission("variabilidade.read"))])
#app.include_router(sobrepreco.router)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = datetime.now(timezone.utc)
    user = request.headers.get("X-User", "anonymous")
    ua = request.headers.get("user-agent", "")
    client_host = request.client.host if request.client else ""
    method = request.method
    path = request.url.path

    response = await call_next(request)
    duration_ms = (datetime.now(timezone.utc) - start).total_seconds() * 1000

    log_payload = {
        "ts": start.isoformat(),
        "user": user,
        "method": method,
        "path": path,
        "status": response.status_code,
        "duration_ms": round(duration_ms, 2),
        "ip": client_host,
        "user_agent": ua,
    }
    access_logger.info(json.dumps(log_payload, ensure_ascii=False))
    return response


@app.get("/")
def root():
    return {"message": "API do NEMESIS ativa"}
