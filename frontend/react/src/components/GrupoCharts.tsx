import Plot from "react-plotly.js";
import { Fracionamento } from "../pages/fracionamento/types";
import { formatCurrencyBR, formatDateBR } from "../utils/formatters";

interface GrupoChartsProps {
  dados: Fracionamento[];
}

// Paleta fixa de cores (pode expandir conforme necessidade)
const colorPalette = [
  "#1f77b4", // azul
  "#ff7f0e", // laranja
  "#2ca02c", // verde
  "#d62728", // vermelho
  "#9467bd", // roxo
  "#8c564b", // marrom
  "#e377c2", // rosa
  "#7f7f7f", // cinza
  "#bcbd22", // oliva
  "#17becf", // ciano
];

// Cria um mapa de elemento → cor fixa
function getColorMap(elementos: string[]) {
  const map: Record<string, string> = {};
  elementos.forEach((el, idx) => {
    map[el] = colorPalette[idx % colorPalette.length];
  });
  return map;
}

// Função utilitária para somar valores por data
function agruparPorData(dados: Fracionamento[]) {
  const mapa = new Map<string, number>();
  dados.forEach(d => {
    const dataISO = new Date(d.data).toISOString().split("T")[0]; // yyyy-mm-dd
    mapa.set(dataISO, (mapa.get(dataISO) || 0) + d.valor);
  });
  return Array.from(mapa.entries()).map(([data, valor]) => ({
    data,
    valor,
  }));
}

// Função para agrupar valores únicos e contar frequência
function agruparPorValor(dados: Fracionamento[]) {
  const mapa = new Map<number, number>();
  dados.forEach(d => {
    mapa.set(d.valor, (mapa.get(d.valor) || 0) + 1);
  });
  return Array.from(mapa.entries()).map(([valor, freq]) => ({
    valor,
    freq,
  }));
}

export function GrupoCharts({ dados }: GrupoChartsProps) {
  if (!dados || dados.length === 0) return null;

  // Composição por elemento da despesa
  const elementos = Array.from(new Set(dados.map(d => d.elemdespesatce)));
  const valoresPorElemento = elementos.map(el =>
    dados
      .filter(d => d.elemdespesatce === el)
      .reduce((sum, d) => sum + d.valor, 0)
  );

  const colorMap = getColorMap(elementos);

  return (
    <div className="mt-8 space-y-8">
      <h3 className="text-lg font-bold mb-2">Visualizações do Grupo</h3>

      {/* Evolução temporal (diário + acumulado) */}
      <Plot
        data={elementos.flatMap(el => {
          const subset = dados.filter(d => d.elemdespesatce === el);
          const subsetAgrupado = agruparPorData(subset).sort(
            (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
          );

          // Valores acumulados
          let acumulado = 0;
          const subsetAcumulado = subsetAgrupado.map(d => {
            acumulado += d.valor;
            return { data: d.data, valor: acumulado };
          });

          return [
            {
              x: subsetAgrupado.map(d => d.data),
              y: subsetAgrupado.map(d => d.valor),
              type: "scatter",
              mode: "lines+markers",
              name: `${el} (diário)`,
              line: { shape: "spline", color: colorMap[el] },
              marker: { color: colorMap[el] },
              hovertemplate: "%{customdata}<br>" + el,
              customdata: subsetAgrupado.map(
                d => `${formatDateBR(d.data)} — ${formatCurrencyBR(d.valor)}`
              ),
            },
            {
              x: subsetAcumulado.map(d => d.data),
              y: subsetAcumulado.map(d => d.valor),
              type: "scatter",
              mode: "lines+markers",
              name: `${el} (acumulado)`,
              line: { dash: "dot", color: colorMap[el] },
              marker: { color: colorMap[el] },
              hovertemplate: "%{customdata}<br>" + el,
              customdata: subsetAcumulado.map(
                d => `${formatDateBR(d.data)} — ${formatCurrencyBR(d.valor)}`
              ),
              visible: "legendonly",
            },
          ];
        })}
        layout={{
          title: { text: "Evolução Temporal dos Empenhos" },
          xaxis: {
            title: { text: "Data" },
            type: "date",
            tickformat: "%d/%m/%Y",
          },
          yaxis: {
            title: { text: "Valor (R$)" },
            tickformat: ",.2f",
            tickprefix: "R$ ",
            automargin: true,
          },
          margin: { t: 40, l: 60, r: 20, b: 40 },
          legend: { orientation: "h", y: -0.3 },
        }}
        style={{ width: "90%", height: "400px", margin: "0 auto" }}
      />

      {/* Pizza por elemento */}
      <Plot
        data={[
          {
            labels: elementos,
            values: valoresPorElemento,
            type: "pie",
            textinfo: "label+percent",
            hovertemplate:
              "%{label}<br>Valor: %{customdata}<extra></extra>",
            customdata: valoresPorElemento.map(v => formatCurrencyBR(v)),
            marker: { colors: elementos.map(el => colorMap[el]) },
            insidetextorientation: "radial",
          },
        ]}
        layout={{
          title: { text: "Composição por Elemento da Despesa" },
          margin: { t: 40, l: 20, r: 20, b: 20 },
        }}
        style={{ width: "90%", height: "400px", margin: "0 auto" }}
      />

      {/* Gráfico de barras para distribuição dos valores */}
      <Plot
        data={elementos.map(el => {
          const subset = dados.filter(d => d.elemdespesatce === el);
          const agrupados = agruparPorValor(subset);
          const total = agrupados.reduce((s, d) => s + d.freq, 0);

          return {
            x: agrupados.map(d => formatCurrencyBR(d.valor)),
            y: agrupados.map(d => d.freq),
            type: "bar",
            name: el,
            marker: { color: colorMap[el] },
            text: agrupados.map(
              d => `${d.freq} (${((d.freq / total) * 100).toFixed(1)}%)`
            ),
            textposition: "auto",
            hovertemplate:
              el +
              "<br>Valor: %{x}<br>Qtd: %{y} (" +
              "%{text})<extra></extra>",
          };
        })}
        layout={{
          barmode: "group",
          title: { text: "Distribuição dos Valores por Elemento da Despesa" },
          xaxis: { title: { text: "Valor (R$)" } },
          yaxis: { title: { text: "Frequência" } },
          yaxis2: {
            title: { text: "Percentual" }, // ✅ corrigido
            overlaying: "y",
            side: "right",
            range: [0, 100],
            ticksuffix: "%",
            showgrid: false,
          },
          shapes: [
            {
              type: "line",
              x0: -0.5,
              x1: elementos.length - 0.5,
              y0: 100,
              y1: 100,
              yref: "y2",
              line: { color: "red", dash: "dot" },
            },
          ],
          margin: { t: 40, l: 60, r: 60, b: 40 },
          legend: { orientation: "h", y: -0.3 },
        }}
        style={{ width: "90%", height: "400px", margin: "0 auto" }}
      />
    </div>
  );
}
