import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { formatCurrencyBR } from "../../utils/formatters";
import Plot from "react-plotly.js";

// Função auxiliar: aceita tanto YYYY-MM-DD quanto DD/MM/YYYY
function formatDateFlexible(value: string): string {
  if (!value) return "-";
  if (value.includes("-")) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("pt-BR");
  }
  if (value.includes("/")) {
    const [dia, mes, ano] = value.split("/");
    if (dia && mes && ano) {
      const d = new Date(Number(ano), Number(mes) - 1, Number(dia));
      if (!isNaN(d.getTime())) return d.toLocaleDateString("pt-BR");
    }
  }
  console.warn("Data inválida recebida:", value);
  return "-";
}

function getEmpenhoDate(e: any): string {
  if (e.data) return formatDateFlexible(e.data);
  if (e.dtempenho) return formatDateFlexible(e.dtempenho);
  return "-";
}

// Formata similaridade (0.87 → 87%)
function formatSimilarity(value: number | undefined): string {
  if (value == null) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

export const SobreprecoResultadosPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [resumo, setResumo] = useState<any | null>(null);
  const [empenhos, setEmpenhos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [filtro, setFiltro] = useState<string>("");

  const ano = searchParams.get("ano");
  const descricao = searchParams.get("descricao");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sobrepreco?ano=${ano}&descricao=${descricao}`);
        if (!response.ok) throw new Error("Erro ao carregar dados");
        const data = await response.json();
        setResumo(data.resumo);
        setEmpenhos(data.empenhos || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ano, descricao]);

  function handleSort(key: string) {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  }

  const empenhosFiltrados = empenhos.filter((e) => {
    if (!filtro.trim()) return true;
    const texto = filtro.toLowerCase();
    return (
      String(e.idempenho).toLowerCase().includes(texto) ||
      String(e.ente).toLowerCase().includes(texto) ||
      String(e.elemdespesatce).toLowerCase().includes(texto) ||
      String(e.historico).toLowerCase().includes(texto)
    );
  });

  const empenhosExibidos = [...empenhosFiltrados].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let valA: any = (a as any)[key];
    let valB: any = (b as any)[key];
    if (key === "data" || key === "dtempenho") {
      valA = a.data || a.dtempenho;
      valB = b.data || b.dtempenho;
    }
    if (valA == null || valB == null) return 0;
    if (key.toLowerCase().includes("data")) {
      const dateA = new Date(valA).getTime();
      const dateB = new Date(valB).getTime();
      return direction === "asc" ? dateA - dateB : dateB - dateA;
    }
    if (typeof valA === "number" && typeof valB === "number") {
      return direction === "asc" ? valA - valB : valB - valA;
    }
    return direction === "asc"
      ? String(valA).localeCompare(String(valB), "pt-BR")
      : String(valB).localeCompare(String(valA), "pt-BR");
  });

  if (loading) return <p>Carregando...</p>;
  if (error) return <p className="text-red-600">Erro: {error}</p>;
  if (!resumo) return <p>Nenhum resultado encontrado.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Resultados de Sobrepreço</h1>

      {/* Resumo */}
      <div className="bg-gray-100 p-4 rounded mb-6">
        <p><strong>Ano:</strong> {resumo.ano}</p>
        <p><strong>Descrição:</strong> {resumo.descricao}</p>
        <p><strong>Nº de empenhos semelhantes:</strong> {resumo.n_resultados}</p>
        <p><strong>Valor médio (grupo):</strong> {formatCurrencyBR(resumo.valor_medio)}</p>
        <p><strong>Mediana (grupo):</strong> {formatCurrencyBR(resumo.valor_mediano)}</p>
        <p><strong>Q1:</strong> {formatCurrencyBR(resumo.q1)}</p>
        <p><strong>Q3:</strong> {formatCurrencyBR(resumo.q3)}</p>
        <p><strong>Limiar IQR:</strong> {formatCurrencyBR(resumo.limiar_iqr)}</p>
      </div>

      {/* Campo de filtro */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filtrar por ID, ente, elemento ou histórico..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Tabela */}
      <h2 className="text-xl font-semibold mb-2">Empenhos encontrados</h2>
      {empenhosExibidos.length === 0 ? (
        <p>Nenhum empenho encontrado.</p>
      ) : (
        <>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th onClick={() => handleSort("idempenho")} className="border px-3 py-2 cursor-pointer">ID</th>
                <th onClick={() => handleSort("ente")} className="border px-3 py-2 cursor-pointer">Ente</th>
                <th onClick={() => handleSort("elemdespesatce")} className="border px-3 py-2 cursor-pointer">Elemento</th>
                <th onClick={() => handleSort("historico")} className="border px-3 py-2 cursor-pointer">Histórico</th>
                <th onClick={() => handleSort("data")} className="border px-3 py-2 cursor-pointer">Data</th>
                <th onClick={() => handleSort("vlr_empenhado")} className="border px-3 py-2 cursor-pointer">Valor</th>
                <th onClick={() => handleSort("similaridade")} className="border px-3 py-2 cursor-pointer">Similaridade</th>
                <th className="border px-3 py-2">Suspeito?</th>
              </tr>
            </thead>
            <tbody>
              {empenhosExibidos.map((e, idx) => (
                <tr key={e.idempenho} className={idx % 2 === 0 ? "bg-white" : "bg-yellow-100"}>
                  <td className="border px-3 py-2">{e.idempenho}</td>
                  <td className="border px-3 py-2">{e.ente}</td>
                  <td className="border px-3 py-2">{e.elemdespesatce}</td>
                  <td className="border px-3 py-2">{e.historico}</td>
                  <td className="border px-3 py-2 text-center">{getEmpenhoDate(e)}</td>
                  <td className="border px-3 py-2 text-right">{formatCurrencyBR(e.vlr_empenhado)}</td>
                  <td className="border px-3 py-2 text-center">{formatSimilarity(e.similaridade)}</td>
                  <td className="border px-3 py-2 text-center">{e.vlr_empenhado > resumo.limiar_iqr ? "⚠️" : "🟢"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Gráficos */}
          <div className="mt-8 space-y-8">
            <Plot
              data={[
                {
                  y: empenhosExibidos.map(e => e.vlr_empenhado),
                  type: "box",
                  name: "Valores Empenhados",
                  boxpoints: "outliers",
                  marker: { color: "#1f77b4" },
                  customdata: empenhosExibidos.map(e => formatCurrencyBR(e.vlr_empenhado)),
                  hovertemplate: "Valor: %{customdata}<extra></extra>",
                },
                {
                  y: [resumo.limiar_iqr],
                  type: "scatter",
                  mode: "lines",
                  name: "Limiar IQR",
                  line: { color: "red", dash: "dot" },
                }
              ]}
              layout={{
                title: { text: "Distribuição dos Valores (Boxplot)" },
                yaxis: { title: { text: "Valor (R$)" }, tickprefix: "R$ ", separatethousands: true }
              }}
              style={{ width: "100%", height: "400px" }}
            />

            <Plot
              data={[
                {
                  x: empenhosExibidos.map(e => getEmpenhoDate(e)),
                  y: empenhosExibidos.map(e => e.vlr_empenhado),
                  mode: "markers",
                  type: "scatter",
                  name: "Empenhos",
                  marker: {
                    color: empenhosExibidos.map(e => e.vlr_empenhado > resumo.limiar_iqr ? "red" : "green"),
                    size: 10,
                  },
                  customdata: empenhosExibidos.map(e => formatCurrencyBR(e.vlr_empenhado)),
                  text: empenhosExibidos.map(e => e.historico),
                  hovertemplate: "Data: %{x}<br>Valor: %{customdata}<br>%{text}<extra></extra>",
                },
                {
                  x: empenhosExibidos.map(e => getEmpenhoDate(e)),
                  y: Array(empenhosExibidos.length).fill(resumo.limiar_iqr),
                  type: "scatter",
                  mode: "lines",
                  name: "Limiar IQR",
                  line: { color: "red", dash: "dot" },
                }
              ]}
              layout={{
                title: { text: "Valores Individuais com Limiar IQR" },
                xaxis: { title: { text: "Data" } },
                yaxis: { title: { text: "Valor (R$)" }, tickprefix: "R$ ", separatethousands: true }
              }}
              style={{ width: "100%", height: "400px" }}
            />

            <Plot
              data={[
                {
                  x: Array.from(new Set(empenhosExibidos.map(e => e.elemdespesatce))),
                  y: Array.from(new Set(empenhosExibidos.map(e => e.elemdespesatce))).map(el =>
                    empenhosExibidos.filter(e => e.elemdespesatce === el).reduce((sum, e) => sum + e.vlr_empenhado, 0)
                  ),
                  type: "bar",
                  marker: { color: "#2ca02c" },
                  customdata: Array.from(new Set(empenhosExibidos.map(e => e.elemdespesatce))).map(el =>
                    formatCurrencyBR(
                      empenhosExibidos.filter(e => e.elemdespesatce === el).reduce((sum, e) => sum + e.vlr_empenhado, 0)
                    )
                  ),
                  hovertemplate: "%{x}<br>Valor Total: %{customdata}<extra></extra>",
                }
              ]}
              layout={{
                title: { text: "Soma de Valores por Elemento da Despesa" },
                xaxis: { title: { text: "Elemento da Despesa" } },
                yaxis: { title: { text: "Valor Total (R$)" }, tickprefix: "R$ ", separatethousands: true }
              }}
              style={{ width: "100%", height: "400px" }}
            />
          </div>
        </>
      )}
    </div>
  );
};
