from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import random
import numpy as np
import pandas as pd
import yaml
import os
from sklearn.preprocessing import StandardScaler


class typeEmpenho(BaseModel):
    empenhoId: str


router = APIRouter()

@router.post("/api/empenhos-3d")
def get_empenhos_3d(request: typeEmpenho):
    script_dir = os.path.dirname(os.path.abspath(__file__))  # folder where script is
    config_path = os.path.join(script_dir, '..', 'config.yaml')
    with open(config_path) as f:
        config = yaml.safe_load(f)
        
    dados_frontend = request.dict()
    empenhoId = dados_frontend['empenhoId']
    
    
    scaler = StandardScaler()
    print(empenhoId)
    if empenhoId == "":
        embeddings = np.load(config['embeddings_3d_path'])
        embeds = embeddings[:, :3]
        variancia_eixos_X_Y_Z = embeddings[:, 3:6]
        num_empenhos = embeddings[:,6]
        
        json_file = 'data/elemdespesas.json'
        elemdespesatce = pd.read_json(json_file)
        embeds_scaled = scaler.fit_transform(embeds)
        dados = [
            {
                "id": f"{i}",
                "descricao": f"{elemdespesatce.iloc[i, 0]}",
                "var_x": float(variancia_eixos_X_Y_Z[i][0]),
                "var_y": float(variancia_eixos_X_Y_Z[i][1]),
                "var_z": float(variancia_eixos_X_Y_Z[i][2]),
                "x": float(embed[0])*2,
                "y": float(embed[1])*2,
                "z": float(embed[2])*2,
                "cluster": int(),
                "num_empenhos": int(num_empenhos[i]),
                "color": "#e6194b"
            }
            for i, embed in enumerate(embeds_scaled)
        ]
    
    else:
        embeddings = np.load(config['all_embeddings_3d_path'])
        embeds = embeddings[f'arr_{empenhoId}']
        
        num_empenhos = len(embeds)
        
        embeds_scaled = scaler.fit_transform(embeds)
        
        cores = ["#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4"]
        
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
                "num_empenhos": int(num_empenhos),
                "color": "#e6194b"
            }
            for i, embed in enumerate(embeds_scaled)
        ]

    return JSONResponse(content=dados)
