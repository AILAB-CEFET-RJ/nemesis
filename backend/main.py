from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.visualizacao3d import router as visualizacao3d_router
from routes.consulta_vs import router as consulta_vs_router
from routes.auto_filling import router as auto_filling
from routes.fracionamentos import router as fracionamentos
import yaml
from transformers import AutoTokenizer, AutoModel
from routes.db import engine 
from routes.sobrepreco import router as sobrepreco_router


with open('config.yaml') as f:
    config = yaml.safe_load(f)
    
    
model_name = config['embedding_model']
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)
print('modelo carregado!')


app = FastAPI()
# guardar o modelo e tokenizer no app.state
app.state.model = model
app.state.tokenizer = tokenizer


# Configurar CORS para permitir frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas
app.include_router(fracionamentos)
app.include_router(visualizacao3d_router)
app.include_router(consulta_vs_router)
app.include_router(auto_filling)
app.include_router(sobrepreco_router)



@app.get("/")
def root():
    return {"message": "API do NEMESIS ativa"}
