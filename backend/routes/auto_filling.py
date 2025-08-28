from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from collections import Counter
import pandas as pd
import json


def calculate_score(words_a, words_b):
    # words_a and words_b are Counters
    all_words = set(words_a) | set(words_b)
    min_sum = sum(min(words_a.get(w,0), words_b.get(w,0)) for w in all_words)
    max_sum = sum(max(words_a.get(w,0), words_b.get(w,0)) for w in all_words)
    return min_sum / max_sum if max_sum > 0 else 0


def count_words(text: str):
    chars = [char.lower() for char in text if char != ' ']
    count = Counter(chars)
    return count



class ConsultaVSRequest(BaseModel):
    consulta: str
    tipo: int
    city: str


router = APIRouter()

@router.post("/api/auto-filling")
def get_empenhos_3d(request: ConsultaVSRequest):
    
    # Aqui você recebe os dados do frontend:
    dados_frontend = request.dict()
    print("tipo recebido do frontend:", dados_frontend['tipo'])
    # TODO: colocar no config.file os paths e os tipos

    if dados_frontend['tipo'] == 1:
        ente_consultado = dados_frontend['city']
        json_path = 'data/unidades.json'
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Transform dict into a DataFrame (one row per unidade)
        rows = []
        for cidade, unidades in data.items():
            for unidade in unidades:
                rows.append({"ente": cidade, "unidade": unidade})
        df = pd.DataFrame(rows)
        print(f"cidade: {ente_consultado}")
        
        json_file = df.loc[df['ente'] == ente_consultado]['unidade']
        
    else:
    
        if dados_frontend['tipo'] == 0:
            json_path = 'data/entes.json'
            
        elif dados_frontend['tipo'] == 2:
            json_path = 'data/elemdespesas.json'
        
        elif dados_frontend['tipo'] == 3:
            json_path = 'data/credores.json'
            
        json_file = pd.read_json(json_path)

        json_file.columns = ['title']
    
    query = dados_frontend['consulta']
    print('dados consultados: ', query)
    
    
    word_count_query = count_words(query)
    
    scores = []
    data = json_file if dados_frontend['tipo'] == 1 else json_file.iloc[:, 0]
    for row in data:
        words_count = count_words(row)
        score = calculate_score(words_count, word_count_query)
        scores.append(score)
    
    df = pd.DataFrame({
        "value": data.values,
        "scores": scores
    })

    # Get the top 5 rows by score
    top_rows = df.nlargest(5, 'scores')

    # Convert to the format you want
    results = [
        {
            "best_match": row.iloc[0],   # assuming first column is the value you want
            "score": row["scores"]
        }
        for _, row in top_rows.iterrows()
    ]

    print(results)

    return JSONResponse(content=results)



