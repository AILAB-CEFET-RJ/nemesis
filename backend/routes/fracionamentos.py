from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from collections import Counter
import pandas as pd


class ConsultaVSRequest(BaseModel):
    idunid: str


router = APIRouter()

@router.post("/api/fracionamentos")
def get_table_fracionamentos(request: ConsultaVSRequest):
    
    print('new world')
    # Aqui você recebe os dados do frontend:
    dados_frontend = request.dict()
    idunid = dados_frontend['idunid']
    print(type(idunid))
    print(f'idunid requested: {idunid}')
    
    table_path = 'data/suspeitas_fracionamento.csv'
    table = pd.read_csv(table_path)
    table_filtered = table.loc[table['idunid'].astype(str) == str(idunid)]

    print(table_filtered)

    return JSONResponse(content=table_filtered.to_dict(orient='records'))



