# Backend NEMESIS – API FastAPI

Este é o backend do sistema NEMESIS, implementado com [FastAPI](https://fastapi.tiangolo.com/). Ele serve dados para a visualização 3D de **itens de empenho** e outros módulos futuros.

---

## 🚀 Como executar localmente

1. Ative o ambiente virtual (`conda` ou `venv`) que contenha o FastAPI e o Uvicorn:

```bash
conda activate nemesis
```

2. Acesse a pasta `backend` e execute o servidor:

```bash
cd backend
python -m uvicorn main:app --reload
```

3. Acesse:

- [http://localhost:8000/](http://localhost:8000/) – status da API
- [http://localhost:8000/api/empenhos-3d](http://localhost:8000/api/empenhos-3d) – dados 3D mockados
- [http://localhost:8000/docs](http://localhost:8000/docs) – documentação interativa Swagger
- [http://localhost:8000/redoc](http://localhost:8000/redoc) – documentação alternativa com ReDoc

---

## 📦 Estrutura do projeto

```
backend/
├── main.py                  # Entrypoint da API
├── routes/
│   └── visualizacao3d.py    # Endpoint com dados mockados 3D
```

---

## 🔄 Exemplo de resposta

```json
[
  {
    "id": "e1",
    "descricao": "Compra de material escolar",
    "x": 0.1,
    "y": 0.5,
    "z": -0.3,
    "cluster": 0,
    "color": "#e6194b"
  }
]
```

---

## 🔧 Requisitos

- Python 3.9 ou superior
- FastAPI
- Uvicorn
- (opcional) Conda para ambiente virtual

Instale com:

```bash
pip install fastapi uvicorn
```

---

## 📄 Licença

Este backend faz parte do sistema NEMESIS – [MIT License](LICENSE)
