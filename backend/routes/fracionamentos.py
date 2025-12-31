from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import pandas as pd
import os
from sqlalchemy import text
from routes.db import engine


class ConsultaVSRequest(BaseModel):
    idunid: str
    cluster_id: str
    ano: str


router = APIRouter()


def carregar_clusters_fracionamento(ano: str) -> pd.DataFrame:
    """
    Tenta carregar Parquet primeiro (recomendado), depois CSV como fallback.
    """
    base_new = f"data/fracionamento/grupo_fracionamento_{ano}"
    parquet_path = f"{base_new}.parquet"
    csv_path = f"{base_new}.csv"

    if os.path.exists(parquet_path):
        return pd.read_parquet(parquet_path)
    if os.path.exists(csv_path):
        return pd.read_csv(csv_path)

    raise FileNotFoundError(f"Arquivo para o ano {ano} não encontrado em {parquet_path} nem {csv_path}.")


@router.post("/api/fracionamentos")
def get_table_fracionamentos(body: ConsultaVSRequest):
    
    dados_frontend = body.dict()
    idunid = dados_frontend['idunid']
    cluster_id = dados_frontend['cluster_id']
    ano = dados_frontend['ano']

    print(f'idunid requested: {idunid}')
    print(f'ano requested: {ano}')
    print(f'cluster id requested: {cluster_id}')
    
    if ano != "":
        try:
            table = carregar_clusters_fracionamento(ano)
        except FileNotFoundError as exc:
            return JSONResponse(content={"error": str(exc)}, status_code=404)

    # filtrar por id unidade
    table_filtered = table.loc[table['idunid'].astype(str) == str(idunid)]
    
    # normalizar datas para string (evita erro de serialização)
    for col in ("data", "dtempenho"):
        if col in table_filtered.columns:
            table_filtered[col] = pd.to_datetime(table_filtered[col], errors="coerce").astype(str)
    
    
    if cluster_id == "":
        table_grouped = table_filtered.groupby('cluster_id').agg({
            'cluster_size': 'first',
            'min_sim': 'first',
            'max_sim': 'first',
            'valor': 'mean',
        }).reset_index()
        return JSONResponse(content=table_grouped.to_dict(orient='records'))
        
    else:
        table_filtered = table_filtered.loc[table_filtered['cluster_id'].astype(str) == str(cluster_id)]
        return JSONResponse(content=table_filtered.to_dict(orient='records'))


@router.get("/api/empenhos/{idempenho}")
def detalhar_empenho(idempenho: str):
    query = text("""
        SELECT 
            idempenho,
            ano,
            ente,
            unidade,
            idunid,
            elemdespesatce,
            credor,
            dtempenho,
            historico,
            vlr_empenhado AS valor
        FROM empenhos
        WHERE idempenho = :idempenho
        LIMIT 1
    """)

    with engine.connect() as conn:
        df = pd.read_sql(query, conn, params={"idempenho": idempenho})

    if df.empty:
        return JSONResponse(content={"error": "Empenho não encontrado"}, status_code=404)

    df["dtempenho"] = pd.to_datetime(df["dtempenho"], errors="coerce").astype(str)
    return JSONResponse(content=df.to_dict(orient="records")[0])
