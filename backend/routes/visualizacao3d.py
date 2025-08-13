from fastapi import APIRouter
from fastapi.responses import JSONResponse
import random
import numpy as np
import pandas as pd
import yaml
import os
from sklearn.preprocessing import StandardScaler


router = APIRouter()

@router.get("/api/empenhos-3d")
def get_empenhos_3d():
    script_dir = os.path.dirname(os.path.abspath(__file__))  # folder where script is
    config_path = os.path.join(script_dir, '..', 'config.yaml')
    with open(config_path) as f:
        config = yaml.safe_load(f)

    cores = ["#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4"]
    embeddings = np.load(config['embeddings_3d_path'])
    
    
    with open(config['elem_despesa_path'], 'r') as f:
        content = f.read().strip()

    # Split by commas into a single-column DataFrame
    elemdespesatce = pd.DataFrame({"descricao": content.split(",")})
    
    scaler = StandardScaler()
    embeddings_scaled = scaler.fit_transform(embeddings)
    dados = [
        {
            "id": f"e{i}",
            "descricao": f"{elemdespesatce.iloc[i]}",
            "x": float(embed[0])*2,
            "y": float(embed[1])*2,
            "z": float(embed[2])*2,
            "cluster": i % 5,
            "color": "#e6194b"
        }
        for i, embed in enumerate(embeddings_scaled)
    ]
    return JSONResponse(content=dados)
