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

export function GrupoCharts({ dados }: GrupoChartsProps) {
  if (!dados || dados.length === 0) return null;

  // Evolução temporal
  const datas = dados.map(d => d.data);
  const valores = dados.map(d => d.valor);

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

      {/* Evolução temporal */}
      <Plot
        data={elementos.map(el => {
          const subset = dados.filter(d => d.elemdespesatce === el);
          return {
            x: subset.map(d => formatDateBR(d.data)),
            y: subset.map(d => d.valor),
            type: "scatter",
            mode: "lines+markers",
            name: el,
            line: { shape: "spline", color: colorMap[el] },
            marker: { color: colorMap[el] },
            hovertemplate:
              "%{x}<br>" +
              el +
              "<br>Valor: %{customdata}<extra></extra>",
            customdata: subset.map(v => formatCurrencyBR(v.valor)),
          };
        })}
        layout={{
          title: { text: "Evolução Temporal dos Empenhos" },
          xaxis: { title: { text: "Data" } },
          yaxis: { title: { text: "Valor (R$)" } },
          margin: { t: 40, l: 60, r: 20, b: 40 },
          legend: { orientation: "h", y: -0.3 },
        }}
        style={{ width: "100%", height: "400px" }}
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
        style={{ width: "100%", height: "400px" }}
      />

      {/* Histograma empilhado */}
      <Plot
        data={elementos.map(el => {
          const subset = dados.filter(d => d.elemdespesatce === el);
          return {
            x: subset.map(d => d.valor),
            type: "histogram",
            name: el,
            marker: { color: colorMap[el] },
            opacity: 0.8,
            hovertemplate:
              el +
              "<br>Valor: %{customdata}<br>Qtd: %{y}<extra></extra>",
            customdata: subset.map(v => formatCurrencyBR(v.valor)),
          };
        })}
        layout={{
          barmode: "stack", // <── histograma empilhado
          title: { text: "Distribuição dos Valores por Elemento da Despesa" },
          xaxis: { title: { text: "Valor (R$)" } },
          yaxis: { title: { text: "Frequência" } },
          margin: { t: 40, l: 60, r: 20, b: 40 },
          legend: { orientation: "h", y: -0.3 },
        }}
        style={{ width: "100%", height: "400px" }}
      />
    </div>
  );
}
