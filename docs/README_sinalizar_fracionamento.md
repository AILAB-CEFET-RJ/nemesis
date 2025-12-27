# Script: sinalizar_fracionamento.py

Este script faz parte do projeto **NEMESIS** e tem como objetivo **sinalizar indícios de fracionamento de despesas** em notas de empenho, quando uma mesma prefeitura emite diversas notas de valor reduzido que, somadas, configurariam uma despesa que deveria ser objeto de processo licitatório.

O foco é **sinalizar** (não afirmar conclusivamente) indícios que merecem atenção dos auditores.

---

## Como funciona

1. **Seleção de empenhos por ano**
   - O usuário informa um ano de referência (`--ano`).
   - O script busca todos os empenhos desse ano na view `empenhos_por_ano`.

2. **Filtragem por valor**
   - O foco é em empenhos **abaixo do limite legal para dispensa de licitação** (ex.: R$ 8.000).
   - Essa filtragem é acelerada pelo índice parcial criado no banco.

3. **Agrupamento**
   - Empenhos são agrupados por:
     - `ente` (prefeitura),
     - `idunid` (unidade orçamentária),
     - `elemdespesatce` (elemento de despesa),
     - período (mês ou dia, dependendo do ajuste).
   - Esse agrupamento permite verificar se várias notas pequenas podem ser, na prática, uma única despesa fracionada.

4. **Sinalização**
   - O script marca como indício de fracionamento os casos em que:
     - há múltiplos empenhos semelhantes emitidos em curto intervalo de tempo,
     - todos abaixo do limite de licitação,
     - mas cujo **valor agregado** supera o limite.

---

## Saídas

O script gera um arquivo `.parquet` ou `.csv` (dependendo do parâmetro `--saida`), contendo:

- `ano`
- `ente`
- `idunid`
- `elemdespesatce`
- `data` (ou período considerado)
- `qtd_empenhos` (número de notas no grupo)
- `valor_total` (soma dos empenhos no grupo)
- `valor_medio` (média por empenho no grupo)
- `fracionamento_suspeito` (True/False)

---

## Exemplo de uso

```bash
python sinalizar_fracionamento.py --ano 2022 --saida fracionamentos_2022.parquet
````

Gera um arquivo `fracionamentos_2022.parquet` com os grupos de empenhos sinalizados.

---

## Exemplo de saída

### `fracionamentos_2022.csv`

```csv
ano,ente,idunid,elemdespesatce,data,qtd_empenhos,valor_total,valor_medio,fracionamento_suspeito
2022,QUISSAMA,101,339030,2022-03-15,5,39500.0,7900.0,True
2022,SAO JOAO DA BARRA,205,339030,2022-06-10,3,23700.0,7900.0,True
2022,ANGRA DOS REIS,310,339039,2022-08-05,1,7500.0,7500.0,False
```

---

## Observações importantes

* O script não conclui irregularidade: apenas **sinaliza agrupamentos suspeitos**.
* A interpretação final cabe ao auditor, que deve considerar:

  * contexto da compra,
  * justificativas apresentadas,
  * legislação vigente no exercício.
* O limite de R\$ 8.000 pode ser parametrizado de acordo com ajustes legais.
