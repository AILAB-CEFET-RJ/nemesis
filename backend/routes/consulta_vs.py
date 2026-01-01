import json
import os
import re
from typing import List, Dict, Any

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from openai import OpenAI

from routes.db_utils import search_db


router = APIRouter()

class ConsultaVSRequest(BaseModel):
    ente: str
    unidade: str
    elementoDespesa: str
    credor: str
    historico: str

LLM_RERANK_ENABLED = os.getenv("CONSULTA_LLM_RERANK", "0") == "1"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_FILTER_MODEL = os.getenv("OPENAI_FILTER_MODEL", "gpt-4o-mini")
RERANK_ALPHA = float(os.getenv("CONSULTA_RERANK_ALPHA", "0.9"))
openai_client = OpenAI(api_key=OPENAI_API_KEY) if (LLM_RERANK_ENABLED and OPENAI_API_KEY) else None


def rerank_with_llm(query: str, itens: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Reordena itens usando LLM. Retorna lista com campo distance preenchido com o score LLM.
    """
    if not openai_client or not itens:
        return itens

    # Palavras da consulta para sobreposição lexical (em maiúsculas, coerente com embeddings)
    query_terms = {t for t in query.upper().split() if t}

    candidatos = [
        {
            "idempenho": it["metadata"]["idempenho"],
            "historico": it.get("document", ""),
            "ente": it["metadata"].get("ente", ""),
            "elemdespesatce": it["metadata"].get("elemdespesatce", ""),
            "credor": it["metadata"].get("credor", ""),
            "similaridade_inicial": it.get("distance") or 0,
        }
        for it in itens[:80]  # limita para não estourar prompt
    ]

    user_prompt = (
        "Consulta: {consulta}\n\n"
        "Empenhos candidatos (JSON):\n{candidatos}\n\n"
        "Atribua um score de relevância entre 0 e 1 para cada item (1 = muito relevante). "
        "Score alto somente se o histórico descrever o MESMO tipo de produto/serviço da consulta. "
        "Penalize irrelevantes ou genéricos. Responda APENAS com JSON válido, sem markdown, no formato:\n"
        '{{"itens": [{{"idempenho": "id", "score": 0.0}}]}}'
    ).format(
        consulta=query,
        candidatos=json.dumps(candidatos, ensure_ascii=False)
    )

    try:
        response = openai_client.responses.create(
            model=OPENAI_FILTER_MODEL,
            input=[
                {"role": "system", "content": [{"type": "input_text", "text": "Seja conciso. Responda somente com JSON válido."}]},
                {"role": "user", "content": [{"type": "input_text", "text": user_prompt}]},
            ],
        )

        raw_text = None
        helper = getattr(response, "output_text", None)
        if isinstance(helper, str):
            raw_text = helper
        elif isinstance(helper, list) and helper:
            raw_text = helper[0]
        if raw_text is None:
            for item in getattr(response, "output", []) or []:
                if getattr(item, "type", "") == "output_text":
                    content = getattr(item, "content", [])
                    if content:
                        maybe = getattr(content[0], "text", None) or (content[0].get("text") if isinstance(content[0], dict) else None)
                        if maybe:
                            raw_text = maybe
                            break

        if not raw_text:
            return itens

        clean_text = (raw_text or "").strip()
        if clean_text.startswith("```"):
            clean_text = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", clean_text)
        if clean_text.endswith("```"):
            clean_text = clean_text[: clean_text.rfind("```")].strip()

        parsed = json.loads(clean_text)
        scores = {str(it["idempenho"]): float(it.get("score", 0)) for it in parsed.get("itens", []) if "idempenho" in it}
        if not scores:
            return itens

        top_rerank = min(50, len(itens))

        # aplica score híbrido: alpha*sim_embedding + (1-alpha)*score_llm
        for idx, it in enumerate(itens):
            base_sim = it.get("distance") or 0
            if idx < top_rerank and it["metadata"]["idempenho"] in scores:
                llm_score = scores[it["metadata"]["idempenho"]]
                # Penaliza itens sem sobreposição lexical com a consulta
                hist_terms = {t for t in it.get("document", "").upper().split() if t}
                if query_terms and hist_terms.isdisjoint(query_terms):
                    llm_score = 0.0
                final = RERANK_ALPHA * base_sim + (1 - RERANK_ALPHA) * llm_score
                it["distance"] = final
            else:
                it["distance"] = base_sim

        itens.sort(key=lambda x: (x.get("distance") is None, -(x.get("distance") or 0)))
        return itens[:50]
    except Exception as exc:
        print(f"[consulta_vs] falha no rerank LLM: {exc}")
        try:
            print(f"[consulta_vs] resposta bruta LLM: {raw_text}")
        except Exception:
            pass
        return itens


@router.post("/api/consulta_vs")
def get_empenhos_vs(body: ConsultaVSRequest, request: Request):
    
    model = request.app.state.model
    tokenizer = request.app.state.tokenizer

    # Aqui você recebe os dados do frontend:
    dados_frontend = body.dict()
    
    ente = dados_frontend["ente"]
    unidade = dados_frontend["unidade"]
    credor = dados_frontend["credor"]
    elem_despesa = dados_frontend["elementoDespesa"]
    historico = dados_frontend["historico"]
    
    results = search_db(model, tokenizer, historico, ente, unidade, credor, elem_despesa)

    # Rerank opcional com LLM, se habilitado
    if LLM_RERANK_ENABLED and historico.strip():
        print("[consulta_vs] rerank LLM ativado")
        results = rerank_with_llm(historico, results)

    return JSONResponse(content=results)
