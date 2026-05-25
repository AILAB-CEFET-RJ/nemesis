# Backend NEMESIS – API FastAPI

Este é o backend do sistema NEMESIS, implementado com [FastAPI](https://fastapi.tiangolo.com/). Ele serve dados para a visualização 3D de notas de empenho e outros módulos futuros, assim como as funcionalidades de fracionamento e de sobrepreço.

---

## Como executar localmente

1. Ative o ambiente virtual (`conda` ou `venv`) que contenha o FastAPI e o Uvicorn:

```bash
conda activate nemesis
```

Caso não tenha ainda um ambiente virtual, crie um com a versão Python 3.11.13:

**Usando Conda:**
```bash
conda create -n nemesis python=3.11.13
conda activate nemesis
```

**Usando venv (nativo do Python):**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

Depois, instale as dependências necessárias:
```bash
pip install fastapi uvicorn
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

## Carga de empenhos

O script `load_empenhos.py` carrega dados de notas de empenho a partir de um arquivo Parquet para o PostgreSQL. Ele foi ajustado para trabalhar com o schema atual definido em `../sql/schema_dump.sql`.

### Responsabilidades do script

- ler e normalizar o arquivo Parquet de entrada;
- validar se o schema esperado já existe no banco;
- popular as tabelas `municipios` e `jurisdicionados`;
- resolver `empenhos.id_jurisdicionado` a partir de `ente` e `unidade`;
- inserir registros em `public.empenhos`;
- deixar `empenhos.id` ser gerado pela sequence do PostgreSQL;
- tratar `idempenho` como chave única com `ON CONFLICT (idempenho)`;
- imprimir verificações finais da carga.

O script não recria a tabela `empenhos` e não aplica o dump SQL automaticamente. O schema deve ser criado antes da execução.

Este script não popula tabelas derivadas ou analíticas, como `empenho_distancias`, `empenho_embeddings`, `clusters_fracionamento` ou `variabilidade_cache`. Essas tabelas dependem de etapas posteriores de processamento, como geração de embeddings, cálculo de distâncias semânticas e detecção de agrupamentos.

### Pré-requisitos

Instale as dependências do backend:

```bash
pip install -r backend/requirements.txt
```

Configure as variáveis de ambiente usadas pela conexão PostgreSQL:

```bash
POSTGRES_USER=nemesis
POSTGRES_PASSWORD=...
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=nemesis
```

Garanta que o banco já contém as tabelas e constraints do dump:

- `public.empenhos`
- `public.municipios`
- `public.jurisdicionados`
- sequence/default de `public.empenhos.id`
- unique constraint em `public.empenhos(idempenho)`
- FK `public.empenhos.id_jurisdicionado -> public.jurisdicionados.id`

### Uso básico

A partir da pasta `backend`, usando o caminho padrão do script:

```bash
cd backend
python load_empenhos.py --input data/tce_large.parquet
```

Também é possível executar a partir da raiz do repositório, ajustando o caminho do arquivo:

```bash
python backend/load_empenhos.py --input backend/data/tce_large.parquet
```

O valor de `--input` é sempre relativo ao diretório em que o comando é executado, a menos que seja informado um caminho absoluto.

### Validação sem carga

Para validar apenas o schema do banco:

```bash
python backend/load_empenhos.py --validate-only
```

Para ler e preparar o arquivo, carregar dimensões em memória e não alterar `empenhos`:

```bash
python backend/load_empenhos.py --input backend/data/tce_large.parquet --dry-run
```

### Recarga completa

Para limpar `empenhos` antes da carga:

```bash
python backend/load_empenhos.py \
  --input backend/data/tce_large.parquet \
  --truncate-empenhos
```

A opção `--truncate-empenhos` executa:

```sql
TRUNCATE TABLE public.empenhos RESTART IDENTITY CASCADE;
```

Use com cuidado: o `CASCADE` pode afetar tabelas dependentes, como tabelas que referenciam `empenhos.id`.

### Atualização de registros existentes

Por padrão, registros com `idempenho` já existente são ignorados:

```sql
ON CONFLICT (idempenho) DO NOTHING
```

Para atualizar registros existentes:

```bash
python backend/load_empenhos.py \
  --input backend/data/tce_large.parquet \
  --upsert
```

Nesse modo, o script usa `ON CONFLICT (idempenho) DO UPDATE`.

### Flags disponíveis

| Flag | Descrição |
| --- | --- |
| `--input` | Caminho do arquivo Parquet de entrada. Padrão: `data/tce_large.parquet`. |
| `--batch-size` | Tamanho dos lotes de insert. Padrão: `5000`. |
| `--dry-run` | Prepara os dados e valida dimensões sem inserir em `empenhos`. |
| `--validate-only` | Valida apenas o schema do banco. |
| `--truncate-empenhos` | Limpa `public.empenhos` com `RESTART IDENTITY CASCADE` antes da carga. |
| `--upsert` | Atualiza registros existentes pelo conflito em `idempenho`. |
| `--ensure-indexes` | Garante índices básicos caso o schema tenha sido criado sem eles. |

### Ordem de execução interna

1. Carrega variáveis de ambiente.
2. Valida o schema no PostgreSQL.
3. Lê o arquivo Parquet.
4. Remove duplicatas por `idempenho`.
5. Converte tipos e normaliza documentos, datas e valores.
6. Insere municípios distintos em `public.municipios`.
7. Insere jurisdicionados distintos em `public.jurisdicionados`.
8. Resolve `id_jurisdicionado` para cada empenho.
9. Insere ou atualiza registros em `public.empenhos`.
10. Imprime contagens finais de consistência.

### Verificações finais

Ao concluir, o script mostra:

- total de registros em `empenhos`;
- registros sem `id`;
- registros sem `idempenho`;
- registros sem `id_jurisdicionado`;
- total de municípios;
- total de jurisdicionados;
- quantidade de `idempenho` duplicados.

As contagens finais não incluem `empenho_distancias`, porque essa tabela não faz parte da carga inicial de empenhos.

### Etapas posteriores

Após carregar `empenhos`, execute os scripts específicos para os dados derivados que forem necessários:

- `generate_embeddings.py`: gera ou atualiza embeddings em `empenho_embeddings`;
- `generate_distances.py`: calcula pares de similaridade para `empenho_distancias`;
- scripts em `auditoria/`: geram análises como fracionamento ou sobrepreço.

Quando tabelas derivadas guardarem referências para `empenhos.id`, verifique se os campos `id_empenho`, `id_empenho_1` ou `id_empenho_2` foram preenchidos conforme o fluxo de cada script.

O uso detalhado de `generate_embeddings.py` está documentado em [`../docs/EMBEDDINGS_SETUP.md`](../docs/EMBEDDINGS_SETUP.md).
O uso detalhado de `generate_distances.py` está documentado em [`../docs/DISTANCES_SETUP.md`](../docs/DISTANCES_SETUP.md).

`generate_distances.py` usa `empenho_embeddings.id_empenho = empenhos.id` e grava `id_empenho_1`/`id_empenho_2` em `empenho_distancias`. Por padrão, ele também tenta preencher esses campos em linhas antigas antes de processar novos grupos; use `--skip_backfill_ids` para pular essa etapa. Para limitar comparações por proximidade temporal, use `--janela_dias`; se essa opção for omitida, todos os pares do grupo são comparados.

O script usa checkpoint por grupo: se já houver pelo menos uma linha em `empenho_distancias` para `(ano, ente, idunid, elemdespesatce)`, o grupo é pulado. Se você alterar a estratégia de cálculo, por exemplo de todos os pares para `--janela_dias 60`, limpe os grupos antigos antes de reprocessar.

Exemplos:

```bash
python generate_distances.py --anos 2019 2020 2021
```

```bash
python generate_distances.py --anos 2019 --janela_dias 60
```

### Observações operacionais

- `id` não deve existir no Parquet de entrada; ele é gerado pelo banco.
- `id_jurisdicionado` é derivado de `ente` e `unidade`.
- `cpfcnpjcredor` e `cnpjraiz` são normalizados como texto para preservar identificadores.
- O script espera que `idempenho`, `ente`, `ano`, `idunid`, `nrempenho`, `elemdespesatce` e `unidade` existam no Parquet.
- Se muitos registros ficarem sem `id_jurisdicionado`, verifique inconsistências em `ente` e `unidade`.

---

## 📄 Licença

Este backend faz parte do sistema NEMESIS – [MIT License](LICENSE)
