from fastapi import APIRouter
from fastapi.responses import JSONResponse
import random

router = APIRouter()

@router.get("/api/empenhos-3d")
def get_empenhos_3d():
    cores = ["#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4"]
    dados = [
        {
            "id": f"e{i}",
            "descricao": f"Empenho {i}",
            "x": random.uniform(-2, 2),
            "y": random.uniform(-2, 2),
            "z": random.uniform(-2, 2),
            "cluster": i % 5,
            "color": cores[i % len(cores)]
        }
        for i in range(200)
    ]
    return JSONResponse(content=dados)
