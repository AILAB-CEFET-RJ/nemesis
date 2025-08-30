from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from collections import Counter
from routes.db_utils import get_unidades_uniques, get_entes_uniques, get_elemdespesa_uniques, get_credores_uniques


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
    """
        Tipo 0: Entes
        Tipo 1: Unidade
        Tipo 2: Elem Despesa
        Tipo 3: Credor
    """
    dados_frontend = request.dict()
    tipo_dado = dados_frontend['tipo'] 

    
    if tipo_dado == 1:
        ente = dados_frontend['city']
        unidades = get_unidades_uniques(ente)
        df = unidades[['idunid', 'unidade']].rename(columns={'unidade': 'title'})
        has_idunid = True
        
    else:
        has_idunid = False
        if tipo_dado == 0:
            df = get_entes_uniques()
            
        elif tipo_dado == 2:
            df = get_elemdespesa_uniques()
        
        elif tipo_dado == 3:
            df = get_credores_uniques()
        df.columns = ['title']
    
    query = dados_frontend['consulta']
    print('dados consultados: ', query)
    
    
    word_count_query = count_words(query)
    
    scores = []
    for row in df['title']:
        words_count = count_words(row)
        score = calculate_score(words_count, word_count_query)
        scores.append(score)
    
    df = df.assign(scores=scores)

    # Get the top 5 rows by score
    top_rows = df.nlargest(5, 'scores')

    # Build results
    results = []
    for _, row in top_rows.iterrows():
        result = {
            "best_match": row["title"],
            "score": row["scores"]
        } 
        if has_idunid:
            result["idunid"] = str(row["idunid"])   # add idunid only for unidades
        results.append(result)


    print(results)

    return JSONResponse(content=results)



