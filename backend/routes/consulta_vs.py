from fastapi import APIRouter
from fastapi.responses import JSONResponse
from routes.db_utils import search_db
from pydantic import BaseModel
import pandas as pd
from fastapi import APIRouter, Request


router = APIRouter()

class ConsultaVSRequest(BaseModel):
    ente: str
    unidade: str
    elementoDespesa: str
    credor: str
    historico: str

@router.post("/api/consulta_vs")
def get_empenhos_vs(body: ConsultaVSRequest, request: Request):
    
    model = request.app.state.model
    tokenizer = request.app.state.tokenizer

    # Aqui você recebe os dados do frontend:
    dados_frontend = body.dict()
    
    ente = dados_frontend["ente"]
    unidade = dados_frontend["unidade"]
    credor = dados_frontend["credor"]
    elem_despesa = dados_frontend["elementoDespesa"]
    historico = dados_frontend["historico"]
    
    results = search_db(model, tokenizer, historico, ente, unidade, credor, elem_despesa)

    return JSONResponse(content=results)