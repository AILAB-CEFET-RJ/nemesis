from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import random
import numpy as np
import pandas as pd
import yaml
import os
from sklearn.preprocessing import StandardScaler
import json
from routes.db_utils import get_embeddings_3d, get_embeddings_3d_within_elem


class typeEmpenho(BaseModel):
    elem_id: str
    ente: str
    unidade: str


router = APIRouter()

@router.post("/api/empenhos-3d")
def get_empenhos_3d(request: typeEmpenho):
        
    dados_frontend = request.dict()
    elemdespesatce = dados_frontend['elem_id']
    ente = dados_frontend['ente']
    unidade = dados_frontend['unidade']
    
    
    scaler = StandardScaler()
    if elemdespesatce == "": # return all average empenhos per elemdespesatce
        df = get_embeddings_3d(ente, unidade)
        embeds = df.values  # convert DataFrame to numpy array
        print(f"shape: {embeds.shape}")
        
        embeds_scaled = scaler.fit_transform(embeds)
        dados = [
            {
                "id": f"{i}",
                "descricao": f"{elemdespesatce.iloc[i, 0]}",
                "var_x": 0.0,
                "var_y": 0.0,
                "var_z": 0.0,
                "x": float(embed[0])*2,
                "y": float(embed[1])*2,
                "z": float(embed[2])*2,
                "num_empenhos": int(len(embeds_scaled[0])),
                "color": "#e6194b"
            }
            for i, embed in enumerate(embeds_scaled)
        ]
    
    else:

        df = get_embeddings_3d_within_elem(elemdespesatce, ente, unidade)
        embeds = df.values  # convert DataFrame to numpy array
        print(f"shape: {embeds.shape}")
        
        embeds_scaled = scaler.fit_transform(embeds)
        
        dados = [
            {
                "id": f"{i}",
                "descricao": "",
                "var_x": 0.0,
                "var_y": 0.0,
                "var_z": 0.0,
                "x": float(embed[0])*2,
                "y": float(embed[1])*2,
                "z": float(embed[2])*2,
                "num_empenhos": int(len(embeds_scaled[0])),
                "color": "#e6194b"
            }
            for i, embed in enumerate(embeds_scaled)
        ]

    return JSONResponse(content=dados)
