import os
import pandas as pd
from sqlalchemy import create_engine, text
from datetime import timedelta
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from dotenv import load_dotenv

# ===============================
# Carregar variáveis de ambiente
# ===============================
load_dotenv()

DB_USER = os.getenv("POSTGRES_USER")
DB_PASS = os.getenv("POSTGRES_PASSWORD")
DB_NAME = os.getenv("POSTGRES_DB")
DB_HOST = os.getenv("POSTGRES_HOST")
DB_PORT = os.getenv("POSTGRES_PORT")

engine = create_engine(f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# ===============================
# Parâmetros ajustáveis
# ===============================
VALOR_LIMIAR = 50000  # limite máximo para considerar suspeito de fracionamento
JANELA_DIAS = 60      # janela temporal
SIMILARIDADE_MINIMA = 0.8  # similaridade mínima entre históricos
BATCH_SIZE = 2000     # processar em lotes

# ===============================
# Funções auxiliares
# ===============================
def carregar_empenhos():
    query = text(f"""
        SELECT e.idempenho, e.idunid, e.elemdespesatce, e.vlr_empenhado,
               e.dt_empenho, emb.embedding
        FROM empenhos e
        JOIN empenho_embeddings emb ON e.idempenho = emb.idempenho
        WHERE e.vlr_empenhado < :limite
        ORDER BY e.idunid, e.elemdespesatce, e.dt_empenho
    """)
    return pd.read_sql(query, engine, params={"limite": VALOR_LIMIAR})

def detectar_fracionamento(df):
    """Detecta grupos de empenhos que podem indicar fracionamento"""
    suspeitos = []

    for (idunid, elem), grupo in df.groupby(["idunid", "elemdespesatce"]):
        grupo = grupo.sort_values("dt_empenho")
        embeddings = np.vstack(grupo["embedding"].values)

        # similaridade entre todos
        sim_matrix = cosine_similarity(embeddings)

        for i in range(len(grupo)):
            for j in range(i + 1, len(grupo)):
                # intervalo de tempo
                dt1, dt2 = pd.to_datetime(grupo.iloc[i]["dt_empenho"]), pd.to_datetime(grupo.iloc[j]["dt_empenho"])
                delta_dias = abs((dt2 - dt1).days)

                if delta_dias <= JANELA_DIAS and sim_matrix[i, j] >= SIMILARIDADE_MINIMA:
                    suspeitos.append({
                        "idunid": idunid,
                        "elemdespesatce": elem,
                        "idempenho_1": grupo.iloc[i]["idempenho"],
                        "idempenho_2": grupo.iloc[j]["idempenho"],
                        "vlr_1": grupo.iloc[i]["vlr_empenhado"],
                        "vlr_2": grupo.iloc[j]["vlr_empenhado"],
                        "dias_dif": delta_dias,
                        "similaridade": sim_matrix[i, j]
                    })
    return pd.DataFrame(suspeitos)

# ===============================
# Execução principal
# ===============================
if __name__ == "__main__":
    print("Carregando empenhos...")
    df = carregar_empenhos()
    print(f"Total de empenhos carregados: {len(df)}")

    print("Detectando possíveis fracionamentos...")
    resultado = detectar_fracionamento(df)

    print(f"Total de pares suspeitos: {len(resultado)}")
    resultado.to_csv("suspeitas_fracionamento.csv", index=False)
    print("Resultados salvos em suspeitas_fracionamento.csv")
