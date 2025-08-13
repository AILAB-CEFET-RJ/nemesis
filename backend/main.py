from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.visualizacao3d import router as visualizacao3d_router

app = FastAPI()

# Configurar CORS para permitir frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas
app.include_router(visualizacao3d_router)

@app.get("/")
def root():
    return {"message": "API do NEMESIS ativa"}
