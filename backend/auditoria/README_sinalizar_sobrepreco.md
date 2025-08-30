# 📊 Script: sinalizar_sobrepreco.py

Este script faz parte do projeto **NEMESIS** e tem como objetivo **sinalizar indícios de sobrepreço** em notas de empenho, comparando um empenho pivot contra empenhos semanticamente semelhantes de **outras prefeituras** no mesmo ano.

O foco é **sinalizar** (não detectar conclusivamente) indícios que devem ser analisados pelos auditores.

---

## ⚙️ Como funciona

1. **Seleção do empenho pivot**
   - O usuário fornece um `idempenho` e um `ano`.
   - O script busca esse empenho na view `empenhos_por_ano` (junto com seu embedding e `elemdespesatce`).

2. **Busca de vizinhos similares**
   - Usa **pgvector** para encontrar empenhos semanticamente semelhantes (histórico textual).
   - Restringe para:
     - Mesmo ano (`ano = :ano`)
     - Outras prefeituras (`ente <> ente_pivot`)
     - Opcionalmente, mesmo elemento de despesa (`--filtrar_elem`).
   - Define um **limite de distância máxima** (`--max_dist`) e número de vizinhos (`--limite`).

3. **Cálculo estatístico**
   - Para os empenhos recuperados, calcula:
     - Mediana (`mediana_estado`)
     - Quartis Q1 e Q3
     - IQR (Intervalo Interquartil)
     - Limiar de outlier (`Q3 + 1,5 × IQR`)
   - Calcula a posição do pivot:
     - **Desvio percentual** em relação à mediana
     - **Percentil** dentro do grupo

4. **Sinalização**
   - Gera alerta (`sobrepreco_suspeito = True`) se o valor do pivot for maior que o limiar definido pelo IQR.
   - Mesmo que não seja outlier, o auditor pode usar o **percentil** e o **desvio percentual** para interpretar o caso.

---

## 📤 Saídas

O script gera dois arquivos CSV (se `--saida` for informado):

1. **Resumo (`*_resumo.csv`)**
   Contém as estatísticas globais do pivot:
   - `idempenho_pivot`
   - `ente_pivot`
   - `ano`
   - `elem_pivot`
   - `valor_pivot`
   - `n_comparacoes`
   - `mediana_estado`, `q1`, `q3`, `limiar_iqr`
   - `desvio_percentual`
   - `percentil_pivot`
   - `sobrepreco_suspeito`
   - `filtro_elemento` (True/False)

2. **Vizinhos (`*_vizinhos.csv`)**
   Contém os empenhos comparáveis:
   - `idempenho`
   - `ente`
   - `historico`
   - `vlr_empenhado`
   - `elemdespesatce`
   - `distancia` (no espaço vetorial)
   - `desvio_percentual_mediana`

---

## 🚀 Exemplo de uso

### Sem filtro por elemento de despesa
```bash
python sinalizar_sobrepreco_intermunicipal.py \
  --idempenho 201800360179100010000001127 \
  --ano 2018 \
  --saida resultados/paracetamol2018
````

### Com filtro por elemento de despesa (`--filtrar_elem`)

```bash
python sinalizar_sobrepreco_intermunicipal.py \
  --idempenho 201800360179100010000001127 \
  --ano 2018 \
  --saida resultados/paracetamol2018 \
  --filtrar_elem
```

---

## 📊 Exemplo de saída

### `paracetamol2018_resumo.csv`

```csv
idempenho_pivot,ente_pivot,ano,elem_pivot,valor_pivot,n_comparacoes,mediana_estado,q1,q3,limiar_iqr,desvio_percentual,percentil_pivot,sobrepreco_suspeito,filtro_elemento
201800360179100010000001127,QUISSAMA,2018,339030,11600.0,121,4202.0,777.6,26700.0,65583.6,176.06,72.73,False,True
```

### `paracetamol2018_vizinhos.csv`

```csv
idempenho,ente,historico,vlr_empenhado,elemdespesatce,distancia,desvio_percentual_mediana
201800270134900010000000815,ANGRA DOS REIS,"Aquisição de medicamentos: Dutasterida, Paracetamol...",8064.00,339030,0.2529,91.9
201800270134900010000000404,ANGRA DOS REIS,"Aquisição de medicamentos: Ivermectina, Paracetamol...",1894.00,339030,0.2536,-54.9
201800080126800020000000152,SAO JOAO DA BARRA,"Medicamentos diversos incluindo Paracetamol 500mg...",2005.02,339030,0.2555,-52.3
```

---

## 📌 Observações importantes

* O script **não decide** se há sobrepreço, apenas **sinaliza indícios** com base em critérios estatísticos.
* O parâmetro `--filtrar_elem` é opcional:

  * Se usado, restringe a comparação ao mesmo `elemdespesatce`.
  * Se não usado, compara com todos os empenhos semanticamente similares, independentemente do elemento.
* A interpretação final cabe sempre ao auditor.

---
