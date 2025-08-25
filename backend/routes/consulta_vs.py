from fastapi import APIRouter
from fastapi.responses import JSONResponse
from chroma_utils import load_vector_store, load_model_tokenizer, create_embeddings, similarity_search
from pydantic import BaseModel
import pandas as pd
import os
import yaml

router = APIRouter()

class ConsultaVSRequest(BaseModel):
    unidade: str
    elementoDespesa: str
    credor: str
    historico: str

@router.post("/api/consulta_vs")
def get_empenhos_vs(request: ConsultaVSRequest):
    script_dir = os.path.dirname(os.path.abspath(__file__))  # folder where script is
    config_path = os.path.join(script_dir, '..', 'config.yaml')
    with open(config_path) as f:
        config = yaml.safe_load(f)
        
        
    try:
        print('loading model..')
        model, tokenizer = load_model_tokenizer()
    except Exception as e:
        return JSONResponse(content={"error": f"Error loading model: {str(e)}"}, status_code=500)

    try:
        print('loading vector_store..')
        vector_store, client, collection = load_vector_store(model)
    except Exception as e:
        return JSONResponse(content={"error": f"Error loading vector store: {str(e)}"}, status_code=500)
    
    
    # Aqui você recebe os dados do frontend:
    dados_frontend = request.dict()
    
    ente = dados_frontend["ente"]
    unidade = dados_frontend["unidade"]
    credor = dados_frontend["credor"]
    elem_despesa = dados_frontend["elementoDespesa"]
    historico = dados_frontend["historico"]

    
    if historico != "":
        embed_query = create_embeddings(pd.Series(historico), model, tokenizer)[0] 
    else:
        embed_query = None
    
    documents = similarity_search(collection, embed_query, ente, unidade, credor, elem_despesa, threshold=10)
    
    return JSONResponse(content=documents)