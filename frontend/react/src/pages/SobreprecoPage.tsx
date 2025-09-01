import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { formatCurrencyBR, formatNumberBR } from "../utils/formatters";
import Plot from "react-plotly.js";

interface ResultadoResumo {
  dt_empenho: string;
  idempenho_pivot: string;
  ente_pivot: string;
  ano: number;
  elem_pivot: string;
  valor_pivot: number;
  historico_pivot: string;
  n_comparacoes: number;
  mediana_estado: number;
  q1: number;
  q3: number;
  limiar_iqr: number;
  desvio_percentual: number;
  percentil_pivot: number;
  sobrepreco_suspeito: boolean;
  filtro_elemento: boolean;
}

interface Vizinho {
  idempenho: string;
  ente: string;
  historico: string;
  vlr_empenhado: number;
  elemdespesatce: string;
  distancia: number;
  desvio_percentual_mediana: number;
}

export function SobreprecoPage() {
  const { prefixo } = useParams<{ prefixo: string }>();
  const [resumo, setResumo] = useState<ResultadoResumo | null>(null);
  const [vizinhos, setVizinhos] = useState<Vizinho[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!prefixo) return;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`http://localhost:8000/api/sobrepreco/${prefixo}`);
        if (!resp.ok) throw new Error("Erro ao buscar dados do backend");
        const data = await resp.json();
        setResumo(data.resumo);
        setVizinhos(data.vizinhos);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [prefixo]);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p className="text-red-600">Erro: {error}</p>;
  if (!resumo) return <p>Nenhum resultado encontrado.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Análise de Sobrepreço</h1>
      <p className="text-gray-600 mb-6">
        Comparação do empenho pivot com empenhos semelhantes de outros municípios.
      </p>

      {/* Resumo em cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded p-4">
          <p className="text-sm text-gray-500">Empenho Pivot</p>
          <p className="font-bold">{resumo.idempenho_pivot}</p>
          <p className="text-xs text-gray-500">{resumo.historico_pivot}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <p className="text-sm text-gray-500">Valor</p>
          <p className="font-bold">{formatCurrencyBR(resumo.valor_pivot)}</p>
          <p className={resumo.sobrepreco_suspeito ? "text-red-600" : "text-green-600"}>
            {resumo.sobrepreco_suspeito ? "⚠ Suspeita de Sobrepreço" : "Dentro da faixa"}
          </p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <p className="text-sm text-gray-500">Comparações</p>
          <p className="font-bold">{resumo.n_comparacoes}</p>
          <p className="text-xs text-gray-500">
            Ano {resumo.ano}, {resumo.elem_pivot}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Boxplot */}
        <Plot
          data={[
            {
              y: vizinhos.map(v => v.vlr_empenhado),
              type: "box",
              name: "Vizinhos",
              boxpoints: "all",
              jitter: 0.3,
              pointpos: -1.8,
            },
            {
              y: [resumo.valor_pivot],
              type: "scatter",
              mode: "markers",
              name: "Pivot",
              marker: { color: resumo.sobrepreco_suspeito ? "red" : "blue", size: 12 },
              text: [formatCurrencyBR(resumo.valor_pivot)],
            },
          ]}
          layout={{
            title: { text: "Distribuição de Valores" },
            yaxis: { title: { text: "Valor (R$)" } },
          }}
          style={{ width: "100%", height: "400px" }}
        />

        {/* Histograma */}
        <Plot
          data={[
            {
              x: vizinhos.map(v => v.vlr_empenhado),
              type: "histogram",
              name: "Vizinhos",
              marker: { color: "teal" },
              opacity: 0.7,
            },
            {
              x: [resumo.valor_pivot],
              type: "scatter",
              mode: "markers",
              name: "Pivot",
              marker: { color: "red", size: 12, symbol: "line-ns-open" },
            },
          ]}
          layout={{
            barmode: "overlay",
            title: { text: "Histograma de Valores (Vizinhos vs Pivot)" },
            xaxis: { title: { text: "Valor (R$)" } },
            yaxis: { title: { text: "Frequência" } },
          }}
          style={{ width: "100%", height: "400px" }}
        />
      </div>

      {/* Tabela de vizinhos */}
      <h2 className="text-xl font-bold mb-2">Empenhos Semelhantes</h2>
      <table className="w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Ente</th>
            <th className="border px-2 py-1">Histórico</th>
            <th className="border px-2 py-1 text-right">Valor</th>
            <th className="border px-2 py-1 text-right">Desvio da Mediana</th>
          </tr>
        </thead>
        <tbody>
          {vizinhos.map((v, idx) => (
            <tr key={v.idempenho} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="border px-2 py-1">{v.idempenho}</td>
              <td className="border px-2 py-1">{v.ente}</td>
              <td className="border px-2 py-1">{v.historico}</td>
              <td className="border px-2 py-1 text-right">{formatCurrencyBR(v.vlr_empenhado)}</td>
              <td className="border px-2 py-1 text-right">
                {formatNumberBR(v.desvio_percentual_mediana)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
