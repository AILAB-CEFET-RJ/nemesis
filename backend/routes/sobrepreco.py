from fastapi import APIRouter
from fastapi.encoders import jsonable_encoder
import json
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
import pandas as pd
from sentence_transformers import SentenceTransformer
from openai import OpenAI

router = APIRouter()

# ======================================================
# Conexão com banco
# ======================================================
load_dotenv()
DB_USER = os.getenv("POSTGRES_USER")
DB_PASS = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST")
DB_PORT = os.getenv("POSTGRES_PORT")
DB_NAME = os.getenv("POSTGRES_DB")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_FILTER_MODEL = os.getenv("OPENAI_FILTER_MODEL", "gpt-4o-mini")

engine = create_engine(
    f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# ======================================================
# Modelo de embeddings
# ======================================================
print("Carregando modelo de embeddings...")
model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
print("Modelo carregado!")

# ======================================================
# Função de negócio
# ======================================================
def montar_resumo(ano: int, descricao: str, registros: list[dict]) -> dict:
    if not registros:
        return {
            "ano": ano,
            "descricao": descricao,
            "n_resultados": 0,
            "valor_medio": None,
            "valor_mediano": None,
            "valor_min": None,
            "valor_max": None,
            "q1": None,
            "q3": None,
            "limiar_iqr": None
        }

    valores = pd.Series([float(r["vlr_empenhado"]) for r in registros])
    q1, q3 = valores.quantile([0.25, 0.75])
    iqr = q3 - q1
    limiar = q3 + 1.5 * iqr

    return {
        "ano": ano,
        "descricao": descricao,
        "n_resultados": len(registros),
        "valor_medio": float(valores.mean()),
        "valor_mediano": float(valores.median()),
        "valor_min": float(valores.min()),
        "valor_max": float(valores.max()),
        "q1": float(q1),
        "q3": float(q3),
        "limiar_iqr": float(limiar)
    }


def sinalizar_sobrepreco(
    ano: int,
    descricao: str,
    max_dist: float = 0.3,
    limite: int = 500
):
    # gera embedding da descrição
    embedding_desc = model.encode([descricao])[0].astype("float32").tolist()

    # monta vetor SQL no formato ARRAY[...]::vector
    embedding_sql = "ARRAY[" + ",".join(str(x) for x in embedding_desc) + "]::vector"

    # consulta no banco usando pgvector
    query = f"""
        SELECT e.idempenho, e.ano, e.ente, e.historico, 
               e.vlr_empenhado, e.elemdespesatce, e.dtempenho,
               emb.embedding <=> {embedding_sql} AS distancia
        FROM empenhos e
        JOIN empenho_embeddings emb USING (idempenho)
        WHERE e.ano = {ano}
          AND (emb.embedding <=> {embedding_sql}) <= {max_dist}
        ORDER BY distancia
        LIMIT {limite}
    """

    df = pd.read_sql(query, engine)

    if df.empty:
        return montar_resumo(ano, descricao, []), []

    # Renomear coluna dtempenho para data
    df = df.rename(columns={"dtempenho": "data"})

    # Calcular similaridade (1 - distância)
    df["similaridade"] = 1 - df["distancia"]

    registros = df.to_dict(orient="records")
    resumo = montar_resumo(ano, descricao, registros)

    return resumo, registros


def filtrar_empenhos_com_llm(descricao: str, empenhos: list[dict], max_itens: int = 100):
    if not openai_client or not OPENAI_API_KEY or not empenhos:
        return empenhos, None

    candidatos = [
        {
            "idempenho": e["idempenho"],
            "historico": e.get("historico", ""),
            "ente": e.get("ente", "")
        }
        for e in empenhos[:max_itens]
    ]

    user_prompt = (
        "Consulta do auditor: {consulta}\n\n"
        "Empenhos candidatos (JSON):\n{candidatos}\n\n"
        "Sua tarefa:\n"
        "1. Decida quais históricos descrevem contratações compatíveis com a consulta.\n"
        "2. Elimine falsos positivos óbvios (ex.: itens com materiais/serviços totalmente distintos).\n"
        "3. Considere apenas conhecimento geral e o próprio histórico informado.\n"
        "4. Produza um resumo breve explicando o critério utilizado.\n"
        "5. Responda OBRIGATORIAMENTE com um JSON válido sem texto extra, seguindo o formato a seguir (sem comentários, sem markdown):\n"
        "{{\n"
        '  "explicacao": "texto breve em pt-BR",\n'
        '  "filtrados": [\n'
        '     {{"idempenho": 123, "historico": "texto original", "motivo": "por que manteve"}}\n'
        "  ]\n"
        "}}\n"
        "Inclua apenas empenhos relevantes para a consulta."
    ).format(
        consulta=descricao,
        candidatos=json.dumps(candidatos, ensure_ascii=False, indent=2)
    )

    try:
        response = openai_client.responses.create(
            model=OPENAI_FILTER_MODEL,
            input=[
                {
                    "role": "system",
                    "content": [
                        {
                            "type": "input_text",
                            "text": "Você é um auditor experiente. Seja conservador e responda apenas com JSON válido."
                        }
                    ]
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": user_prompt
                        }
                    ]
                }
            ]
        )

        extracted_chunks: list[str] = []

        # Alguns modelos expõem um helper output_text
        helper_text = getattr(response, "output_text", None)
        if isinstance(helper_text, list):
            extracted_chunks.extend(helper_text)
        elif isinstance(helper_text, str):
            extracted_chunks.append(helper_text)

        if not extracted_chunks:
            for item in getattr(response, "output", []) or []:
                # Pode vir como ResponseOutputText ou ResponseOutputMessage
                item_type = getattr(item, "type", "")
                if item_type == "output_text":
                    for chunk in getattr(item, "content", []) or []:
                        chunk_type = getattr(chunk, "type", "")
                        text_value = None
                        if isinstance(chunk, dict):
                            text_value = chunk.get("text")
                        else:
                            text_value = getattr(chunk, "text", None)
                        if text_value:
                            extracted_chunks.append(text_value)
                elif item_type == "message":
                    for message in getattr(item, "content", []) or []:
                        text_value = getattr(message, "text", None)
                        if text_value:
                            extracted_chunks.append(text_value)

        raw_json = "".join(filter(None, extracted_chunks)).strip()
        if raw_json.startswith("```"):
            raw_json = raw_json.strip("`")
            if raw_json.lower().startswith("json"):
                raw_json = raw_json[4:].strip()

        if not raw_json:
            raise ValueError("LLM não retornou texto para ser parseado.")

        parsed = json.loads(raw_json)
        if not isinstance(parsed, dict):
            raise ValueError("Resposta do LLM não é um objeto JSON.")

        ids_filtrados: set[int] = set()
        for item in parsed.get("filtrados", []) or []:
            if not isinstance(item, dict):
                continue
            idempenho = item.get("idempenho")
            if idempenho is None:
                continue
            try:
                idempenho_int = int(str(idempenho).strip())
            except (ValueError, TypeError):
                continue
            ids_filtrados.add(idempenho_int)

        empenhos_filtrados = []
        if ids_filtrados:
            for e in empenhos:
                try:
                    idempenho_val = int(e["idempenho"])
                except (ValueError, TypeError):
                    continue
                if idempenho_val in ids_filtrados:
                    empenhos_filtrados.append(e)

        return empenhos_filtrados, {
            "explicacao": parsed.get("explicacao", ""),
            "total_recebido": len(empenhos),
            "avaliados": len(candidatos),
            "retornados": len(empenhos_filtrados),
            "modelo": OPENAI_FILTER_MODEL,
            "aplicado": True
        }
    except Exception as exc:
        print(f"[LLM] Falha ao filtrar resultados: {exc}")
        return empenhos, {
            "explicacao": "Não foi possível aplicar o filtro inteligente. Mostrando todos os resultados.",
            "erro": str(exc),
            "aplicado": False
        }


# ======================================================
# Endpoint FastAPI
# ======================================================
@router.get("/api/sobrepreco")
def api_sobrepreco(
    ano: int,
    descricao: str,
    max_dist: float = 0.6,  # aumentei o valor padrão
    limite: int = 500
):
    resumo_total, empenhos_totais = sinalizar_sobrepreco(
        ano=ano,
        descricao=descricao,
        max_dist=max_dist,
        limite=limite
    )

    filtro_llm = None
    empenhos_filtrados: list[dict] = []
    resumo_filtrado = None
    filtro_aplicado = False

    if empenhos_totais:
        empenhos_filtrados, filtro_llm = filtrar_empenhos_com_llm(descricao, empenhos_totais)
        filtro_aplicado = bool(filtro_llm and not filtro_llm.get("erro") and filtro_llm.get("aplicado", True))
        if filtro_aplicado:
            resumo_filtrado = montar_resumo(ano, descricao, empenhos_filtrados)
        else:
            empenhos_filtrados = []

    empenhos_exibidos = empenhos_filtrados if filtro_aplicado else empenhos_totais
    resumo_exibido = resumo_filtrado if filtro_aplicado and resumo_filtrado else resumo_total

    print(f"[DEBUG] Retornando {len(empenhos_exibidos)} resultados filtrados para '{descricao}' ({ano})")

    return {
        "resumo": jsonable_encoder(resumo_exibido),
        "resumo_bruto": jsonable_encoder(resumo_total),
        "resumo_filtrado": jsonable_encoder(resumo_filtrado),
        "empenhos": jsonable_encoder(empenhos_exibidos),
        "empenhos_originais": jsonable_encoder(empenhos_totais),
        "empenhos_filtrados": jsonable_encoder(empenhos_filtrados),
        "filtro_llm": jsonable_encoder(filtro_llm),
        "filtro_aplicado": filtro_aplicado
    }
