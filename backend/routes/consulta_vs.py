from fastapi import APIRouter
from fastapi.responses import JSONResponse
from routes.db_utils import search_db
from pydantic import BaseModel
import pandas as pd


router = APIRouter()

class ConsultaVSRequest(BaseModel):
    ente: str
    unidade: str
    elementoDespesa: str
    credor: str
    historico: str

@router.post("/api/consulta_vs")
def get_empenhos_vs(request: ConsultaVSRequest):

    # Aqui você recebe os dados do frontend:
    dados_frontend = request.dict()
    
    ente = dados_frontend["ente"]
    unidade = dados_frontend["unidade"]
    credor = dados_frontend["credor"]
    elem_despesa = dados_frontend["elementoDespesa"]
    historico = dados_frontend["historico"]
    
    results = search_db(historico, ente, unidade, credor, elem_despesa)
    
    # print(results)
    return JSONResponse(content=results)