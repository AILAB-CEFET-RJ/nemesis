from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from collections import Counter
import pandas as pd


class ConsultaVSRequest(BaseModel):
    idunid: str
    cluster_id: str
    ano: str


router = APIRouter()

@router.post("/api/fracionamentos")
def get_table_fracionamentos(body: ConsultaVSRequest):
    
    # Aqui você recebe os dados do frontend:
    dados_frontend = body.dict()
    idunid = dados_frontend['idunid']
    cluster_id = dados_frontend['cluster_id']
    ano = dados_frontend['ano']

    print(f'idunid requested: {idunid}')
    print(f'ano requested: {ano}')
    
    if ano != "":
        try:
            table_path = f'data/fracionamento/suspeitas_fracionamento_{ano}.csv'
            table = pd.read_csv(table_path)
        except FileNotFoundError:
            return JSONResponse(content={"error": f"Arquivo para o ano {ano} não encontrado."}, status_code=404)

    # filtrar por id unidade
    table_filtered = table.loc[table['idunid'].astype(str) == str(idunid)]
    
    
    if cluster_id == "":
        table_grouped = table_filtered.groupby('cluster_id').agg({
            'cluster_size': 'first',
            'min_sim': 'first',
            'max_sim': 'first',
            'valor': 'mean',
        }).reset_index()
        return JSONResponse(content=table_grouped.to_dict(orient='records'))
        
    else:
        print(table_filtered)
        table_filtered = table_filtered.loc[table_filtered['cluster_id'].astype(str) == str(cluster_id)]
        return JSONResponse(content=table_filtered.to_dict(orient='records'))



