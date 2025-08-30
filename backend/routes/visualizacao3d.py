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
    elemdespesatce: str
    ente: str
    unidade: str


router = APIRouter()

@router.post("/api/empenhos-3d")
def get_empenhos_3d(request: typeEmpenho):
        
    dados_frontend = request.dict()
    elemdespesatce = dados_frontend['elemdespesatce']
    ente = dados_frontend['ente']
    unidade = dados_frontend['unidade']
    
    
    scaler = StandardScaler()
    if elemdespesatce == "": # return all average empenhos per elemdespesatce
        df = get_embeddings_3d(ente, unidade) # elemdespesatce and avg_embedding
        # Convert string representations of lists to actual lists
        embeds = np.vstack(df['avg_embedding'].apply(lambda x: json.loads(x) if isinstance(x, str) else x).to_numpy())
        embeds_scaled = scaler.fit_transform(embeds)

        dados = [
            {
                "id": str(i),
                "descricao": str(df['elemdespesatce'].iloc[i]),
                "elemdespesatce": f"{elemdespesatce}",
                "var_x": 0.0,
                "var_y": 0.0,
                "var_z": 0.0,
                "x": float(embed[0]) * 2,
                "y": float(embed[1]) * 2,
                "z": float(embed[2]) * 2,
                "color": "#e6194b",
            }
            for i, embed in enumerate(embeds_scaled)
        ]
    else:
        df = get_embeddings_3d_within_elem(elemdespesatce, ente, unidade)
        embeds = np.vstack(df['embedding_reduced'].apply(lambda x: json.loads(x) if isinstance(x, str) else x).to_numpy())
        embeds_scaled = scaler.fit_transform(embeds)
        var_X = embeds_scaled[:,0].var()
        var_Y = embeds_scaled[:,1].var()
        var_Z = embeds_scaled[:,2].var()
        
        dados = [
            {
                "id": f"{i}",
                "descricao": f"{df.iloc[i]['historico']}",
                "elemdespesatce": f"{df.iloc[i]['elemdespesatce']}",
                "credor": f"{df.iloc[i]['credor']}",
                "unidade": f"{df.iloc[i]['unidade']}",
                "var_x": float(var_X),
                "var_y": float(var_Y),
                "var_z": float(var_Z),
                "x": float(embed[0])*2,
                "y": float(embed[1])*2,
                "z": float(embed[2])*2,
                "color": "#e6194b"
            }
            for i, embed in enumerate(embeds_scaled)
        ]

    return JSONResponse(content=dados)
