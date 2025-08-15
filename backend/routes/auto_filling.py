from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from collections import Counter
import pandas as pd


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


router = APIRouter()

@router.post("/api/auto-filling")
def get_empenhos_3d(request: ConsultaVSRequest):
    
    # Aqui você recebe os dados do frontend:
    dados_frontend = request.dict()
    print("tipo recebido do frontend:", dados_frontend['tipo'])
    if dados_frontend['tipo'] == 0:
        json_file = 'data/unidades.json'
        
    elif dados_frontend['tipo'] == 1:
        json_file = 'data/elemdespesas.json'
    
    elif dados_frontend['tipo'] == 2:
        json_file = 'data/credores.json'
        
    json = pd.read_json(json_file)
    json.columns = ['title']
    
    query = dados_frontend['consulta']
    print('dados consultados: ', query)
    word_count_query = count_words(query)
    
    scores = []
    for row in json.iloc[:, 0]:
        words_count = count_words(row)
        score = calculate_score(words_count, word_count_query)
        scores.append(score)

    json['scores'] = scores
    top_idx = json['scores'].idxmax()
    top_row = json.iloc[top_idx]
    result = {
        "best_match": top_row.iloc[0],
        "score": top_row['scores']
    }
    
    print(result)
    
    return JSONResponse(content=top_row.iloc[0])



