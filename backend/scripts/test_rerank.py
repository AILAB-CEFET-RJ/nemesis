"""
Script rápido para testar o rerank com LLM na consulta de empenhos.

Uso:
  EXPORT OPENAI_API_KEY=...   # se ainda não estiver no ambiente
  EXPORT CONSULTA_LLM_RERANK=1
  python backend/scripts/test_rerank.py --query "adocante liquido" --candidates sample.json

Formato do sample.json:
[
  {
    "document": "ADOCANTE LIQUIDO",
    "metadata": {
      "idempenho": "123",
      "ente": "CIDADE",
      "unidade": "SECRETARIA",
      "elemdespesatce": "MATERIAL DE CONSUMO",
      "credor": "FORNECEDOR",
      "vlr_empenho": "100.0",
      "dtempenho": "2019-01-01"
    },
    "distance": 0.95  # similaridade inicial do embedding (0 a 1)
  }
]
"""

import argparse
import json
import os
import sys
from pathlib import Path

# garante import dos módulos locais (routes/*) quando executado via -m ou direto
sys.path.append(str(Path(__file__).resolve().parents[1]))
from routes.consulta_vs import rerank_with_llm  # type: ignore  # noqa


def load_candidates(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def main():
    parser = argparse.ArgumentParser(description="Testa rerank LLM da consulta de empenhos")
    parser.add_argument("--query", required=True, help="Consulta/histórico do usuário")
    parser.add_argument(
        "--candidates",
        required=True,
        help="Arquivo JSON com a lista de candidatos (formato descrito no header do script)",
    )
    args = parser.parse_args()

    if os.getenv("CONSULTA_LLM_RERANK", "0") != "1":
        print("AVISO: defina CONSULTA_LLM_RERANK=1 para ativar o rerank. Rodando mesmo assim.")
    if not os.getenv("OPENAI_API_KEY"):
        print("AVISO: OPENAI_API_KEY não definido; o rerank não será executado.")

    candidates = load_candidates(Path(args.candidates))
    reranked = rerank_with_llm(args.query, candidates)

    print("\n--- TOP 5 APÓS RERANK ---")
    for it in reranked[:5]:
        print(
            f"ID {it['metadata']['idempenho']:<15} "
            f"score={it.get('distance')}, hist={it.get('document','')[:60]}"
        )


if __name__ == "__main__":
    main()
