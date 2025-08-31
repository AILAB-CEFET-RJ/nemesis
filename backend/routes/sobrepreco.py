from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import os

router = APIRouter(prefix="/api/sobrepreco", tags=["sobrepreco"])

BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "sobrepreco")
BASE_DIR = os.path.abspath(BASE_DIR)

@router.get("/{prefixo}")
def get_sobrepreco(prefixo: str):
    """
    Lê arquivos CSV gerados pelo sinalizar_sobrepreco.py
    e retorna em JSON para o frontend.
    Exemplo: GET /api/sobrepreco/paracetamol2018
    """
    resumo_path = os.path.join(BASE_DIR, f"{prefixo}_resumo.csv")
    vizinhos_path = os.path.join(BASE_DIR, f"{prefixo}_vizinhos.csv")

    if not os.path.exists(resumo_path) or not os.path.exists(vizinhos_path):
        raise HTTPException(status_code=404, detail="Arquivos de resultado não encontrados.")

    print(">> Procurando arquivos em:", resumo_path)
    resumo_df = pd.read_csv(resumo_path)
    if resumo_df.empty:
        raise HTTPException(status_code=400, detail="Arquivo resumo vazio.")
    resumo = resumo_df.iloc[0].to_dict()

    vizinhos_df = pd.read_csv(vizinhos_path)
    vizinhos = vizinhos_df.to_dict(orient="records")

    return JSONResponse(content={"resumo": resumo, "vizinhos": vizinhos})
