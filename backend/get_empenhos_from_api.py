import requests
from datetime import datetime
import csv

# Coloque aqui a chave da API (depois que receber)
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJSNlZEbDZwc1hPdHVoMm9aQnQzM083cHV2bGw3UThlRXJ5V0ZjVU5yM0JFTUZJSWVMNFUzNDBzaFZNckE3Z1JfMkI4cFlmenhTc3o5V0hZdyIsImlhdCI6MTc1NTM1NjU2M30.DmANW8U-WIlNpyANp5oN6vJFiONMUqhRNYXE4z_FTMQ"

def buscar_empenhos_por_data(data_str, limite=50):
    try:
        data = datetime.strptime(data_str, "%d/%m/%Y")
        data_formatada = data.strftime("%Y-%m-%d")
    except ValueError:
        print("Formato de data inválido. Use DD/MM/AAAA.")
        return

    url = "https://api.portaldatransparencia.gov.br/api-de-dados/empenhos"
    params = {
        "dataInicio": data_formatada,
        "dataFim": data_formatada,
        "pagina": 1,
        "tamanhoPagina": limite
    }

    headers = {
        "chave-api-dados": API_KEY,
        "User-Agent": "Mozilla/5.0 (compatible; Python Script)",
        "Accept": "application/json"
    }

    print(f"Consultando empenhos para {data_str}...")
    response = requests.get(url, params=params, headers=headers)

    if response.status_code == 200:
        empenhos = response.json()
        if not empenhos:
            print("Nenhum empenho encontrado para a data especificada.")
            return

        nome_arquivo = f"empenhos_{data.strftime('%Y%m%d')}.csv"
        with open(nome_arquivo, "w", newline='', encoding="utf-8") as csvfile:
            fieldnames = empenhos[0].keys()
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for emp in empenhos:
                writer.writerow(emp)

        print(f"{len(empenhos)} empenhos salvos em {nome_arquivo}.")

    else:
        print("Erro na requisição:", response.status_code)
        print(response.text)

# Exemplo de uso:
buscar_empenhos_por_data("16/08/2025", limite=100)
