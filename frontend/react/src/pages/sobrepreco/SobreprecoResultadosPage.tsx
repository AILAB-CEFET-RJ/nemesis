import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { formatCurrencyBR } from "../../utils/formatters";
import Plot from "react-plotly.js";
import { AlertTriangle, ShieldCheck } from "lucide-react";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

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
  const [resumoBruto, setResumoBruto] = useState<any | null>(null);
  const [resumoFiltrado, setResumoFiltrado] = useState<any | null>(null);
  const [empenhosOriginais, setEmpenhosOriginais] = useState<any[]>([]);
  const [empenhosFiltrados, setEmpenhosFiltrados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [filtro, setFiltro] = useState<string>("");
  const [filtroLLM, setFiltroLLM] = useState<any | null>(null);
  const [exibirFiltrados, setExibirFiltrados] = useState<boolean>(true);

  const ano = searchParams.get("ano");
  const descricao = searchParams.get("descricao");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/sobrepreco?ano=${ano}&descricao=${descricao}`);
        if (!response.ok) throw new Error("Erro ao carregar dados");
        const data = await response.json();

        console.log("[DEBUG] Resposta recebida do backend:", data);
        setResumoBruto(data.resumo_bruto || data.resumo || null);
        setResumoFiltrado(data.resumo_filtrado || null);
        setEmpenhosOriginais(data.empenhos_originais || data.empenhos || []);
        setEmpenhosFiltrados(data.empenhos_filtrados || []);
        setFiltroLLM(data.filtro_llm || null);
        const filtroDisponivel = Boolean(data.filtro_aplicado && !(data.filtro_llm && data.filtro_llm.erro));
        setExibirFiltrados(filtroDisponivel);
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

  const sortableHeaders = [
    { key: "idempenho", label: "ID" },
    { key: "ente", label: "Ente" },
    { key: "elemdespesatce", label: "Elemento" },
    { key: "historico", label: "Histórico" },
    { key: "data", label: "Data" },
    { key: "vlr_empenhado", label: "Valor" },
    { key: "similaridade", label: "Similaridade" },
  ];

  const getAriaSort = (key: string): "ascending" | "descending" | "none" => {
    if (!sortConfig || sortConfig.key !== key) return "none";
    return sortConfig.direction === "asc" ? "ascending" : "descending";
  };

  const getSortIndicator = (key: string): string => {
    if (!sortConfig || sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  const filtroDisponivel = Boolean(filtroLLM && !filtroLLM.erro && (filtroLLM.aplicado ?? true));
  const exibindoFiltrados = exibirFiltrados && filtroDisponivel;
  const totalOriginais = empenhosOriginais.length;
  const totalFiltrados = empenhosFiltrados.length;
  const listaBase = exibindoFiltrados ? empenhosFiltrados : empenhosOriginais;
  const resumoBase = resumoBruto || resumoFiltrado;
  const resumo = (exibindoFiltrados && resumoFiltrado ? resumoFiltrado : resumoBruto) || resumoBase;
  const aprovadosLLM = filtroLLM?.retornados ?? totalFiltrados;
  const avaliadosLLM = filtroLLM?.avaliados ?? Math.min(totalOriginais, 100);

  const empenhosFiltradosPorTexto = listaBase.filter((e) => {
    if (!filtro.trim()) return true;
    const texto = filtro.toLowerCase();
    return (
      String(e.idempenho).toLowerCase().includes(texto) ||
      String(e.ente).toLowerCase().includes(texto) ||
      String(e.elemdespesatce).toLowerCase().includes(texto) ||
      String(e.historico).toLowerCase().includes(texto)
    );
  });

  const empenhosExibidos = [...empenhosFiltradosPorTexto].sort((a, b) => {
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

  if (loading || !resumo) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-200">
          <div className="h-8 w-8 animate-spin rounded-full border-t-4 border-rose-400 border-opacity-60" />
          <span>{loading ? "Carregando análise..." : "Nenhum resultado encontrado."}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-red-300">Erro: {error}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.25),_transparent_65%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-14">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-rose-300">
            resultados de sobrepreço
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">
            {descricao || "Consulta"} · {ano}
          </h1>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Veja as estatísticas do grupo comparativo, os empenhos semelhantes encontrados e o relatório
            do filtro inteligente.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-200">
              Resumo estatístico
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Grupo de referência</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Empenhos analisados</dt>
                <dd className="text-xl font-semibold text-white">{resumo.n_resultados}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Valor médio</dt>
                <dd className="text-xl font-semibold text-white">
                  {formatCurrencyBR(resumo.valor_medio)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Mediana</dt>
                <dd className="text-xl font-semibold text-white">
                  {formatCurrencyBR(resumo.valor_mediano)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Limiar IQR</dt>
                <dd className="text-xl font-semibold text-rose-200">
                  {formatCurrencyBR(resumo.limiar_iqr)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Q1</dt>
                <dd className="text-xl font-semibold text-white">{formatCurrencyBR(resumo.q1)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Q3</dt>
                <dd className="text-xl font-semibold text-white">{formatCurrencyBR(resumo.q3)}</dd>
              </div>
            </dl>
          </div>

          {filtroLLM && (
            <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-rose-400/20 p-2 text-rose-200">
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-300">
                      Filtro inteligente (LLM)
                    </p>
                    <p className="text-sm text-white">{filtroLLM.explicacao}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-400">
                  Fonte: {filtroLLM.modelo || "LLM"} · Avaliados: {avaliadosLLM} · Aprovados: {aprovadosLLM} ·
                  Visualizando: {exibindoFiltrados ? "apenas aprovados" : "lista completa"}
                </p>
                {filtroLLM.erro && (
                  <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    Aviso: {filtroLLM.erro}
                  </p>
                )}
              </div>
            </aside>
          )}
        </section>

        {filtroDisponivel && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-slate-200">Visualização:</span>
            <div className="inline-flex rounded-full border border-rose-400/60 bg-slate-900/60 p-1 text-xs">
              <button
                className={`rounded-full px-4 py-1 ${
                  exibindoFiltrados ? "bg-rose-400 text-slate-900" : "text-rose-200"
                }`}
                onClick={() => setExibirFiltrados(true)}
              >
                Filtrados (LLM) ({totalFiltrados})
              </button>
              <button
                className={`rounded-full px-4 py-1 ${
                  !exibindoFiltrados ? "bg-rose-400 text-slate-900" : "text-rose-200"
                }`}
                onClick={() => setExibirFiltrados(false)}
              >
                Lista completa ({totalOriginais})
              </button>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Filtrar por ID, ente, elemento ou histórico..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none transition focus:border-rose-300 focus:bg-slate-900/70"
            />
          </div>

          <h2 className="text-xl font-semibold text-white">Empenhos encontrados</h2>
          {empenhosExibidos.length === 0 ? (
            <p className="mt-4 text-sm text-slate-300">Nenhum empenho encontrado.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-full text-sm text-white">
                <thead className="bg-white/10 text-xs uppercase tracking-wide text-slate-300">
                  <tr>
                    {sortableHeaders.map(({ key, label }) => {
                      const isActive = sortConfig?.key === key;
                      return (
                        <th
                          key={key}
                          onClick={() => handleSort(key)}
                          aria-sort={getAriaSort(key)}
                          className={`cursor-pointer px-4 py-3 text-left select-none ${
                            isActive ? "text-rose-200" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{label}</span>
                            <span className="text-xs opacity-70" aria-hidden="true">
                              {getSortIndicator(key)}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                    <th className="px-4 py-3 text-left">Suspeito?</th>
                  </tr>
                </thead>
                <tbody>
                  {empenhosExibidos.map((e, idx) => (
                    <tr
                      key={e.idempenho}
                      className={idx % 2 === 0 ? "bg-white/5" : "bg-white/10"}
                    >
                      <td className="px-4 py-3 font-semibold text-white">
                        <span
                          className="inline-flex max-w-[140px] items-center gap-2 rounded-full bg-white/10 px-2 py-1 font-mono text-xs text-white"
                          title={String(e.idempenho)}
                        >
                          {String(e.idempenho).length > 10
                            ? `…${String(e.idempenho).slice(-10)}`
                            : e.idempenho}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-100">{e.ente}</td>
                      <td className="px-4 py-3 text-slate-100">{e.elemdespesatce}</td>
                      <td className="px-4 py-3 text-slate-100">{e.historico}</td>
                      <td className="px-4 py-3 text-center text-slate-100">{getEmpenhoDate(e)}</td>
                      <td className="px-4 py-3 text-right text-slate-100">
                        {formatCurrencyBR(e.vlr_empenhado)}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-100">
                        {formatSimilarity(e.similaridade)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {resumo?.limiar_iqr != null && e.vlr_empenhado > resumo.limiar_iqr ? (
                          <AlertTriangle className="inline h-5 w-5 text-amber-400" aria-label="Acima do limiar" />
                        ) : (
                          <ShieldCheck className="inline h-5 w-5 text-emerald-300" aria-label="Dentro do padrão" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur space-y-8">
          <Plot
            data={[
              {
                y: empenhosExibidos.map((e) => e.vlr_empenhado),
                type: "box",
                name: "Valores Empenhados",
                boxpoints: "outliers",
                marker: { color: "#fb7185" },
                customdata: empenhosExibidos.map((e) => formatCurrencyBR(e.vlr_empenhado)),
                hovertemplate: "Valor: %{customdata}<extra></extra>",
              },
              {
                y: [resumo.limiar_iqr],
                type: "scatter",
                mode: "lines",
                name: "Limiar IQR",
                line: { color: "#ef4444", dash: "dot" },
              },
            ]}
            layout={{
              title: { text: "Distribuição dos Valores (Boxplot)", font: { color: "#f8fafc" } },
              paper_bgcolor: "rgba(0,0,0,0)",
              plot_bgcolor: "rgba(0,0,0,0)",
              font: { color: "#e2e8f0" },
              yaxis: { title: { text: "Valor (R$)" }, tickprefix: "R$ ", separatethousands: true },
            }}
            style={{ width: "100%", height: "400px" }}
          />

          <Plot
            data={[
              {
                x: empenhosExibidos.map((e) => getEmpenhoDate(e)),
                y: empenhosExibidos.map((e) => e.vlr_empenhado),
                mode: "markers",
                type: "scatter",
                name: "Empenhos",
                marker: {
                  color: empenhosExibidos.map((e) => (e.vlr_empenhado > resumo.limiar_iqr ? "#f87171" : "#34d399")),
                  size: 10,
                },
                customdata: empenhosExibidos.map((e) => formatCurrencyBR(e.vlr_empenhado)),
                text: empenhosExibidos.map((e) => e.historico),
                hovertemplate: "Data: %{x}<br>Valor: %{customdata}<br>%{text}<extra></extra>",
              },
              {
                x: empenhosExibidos.map((e) => getEmpenhoDate(e)),
                y: Array(empenhosExibidos.length).fill(resumo.limiar_iqr),
                type: "scatter",
                mode: "lines",
                name: "Limiar IQR",
                line: { color: "#ef4444", dash: "dot" },
              },
            ]}
            layout={{
              title: { text: "Valores Individuais com Limiar IQR", font: { color: "#f8fafc" } },
              paper_bgcolor: "rgba(0,0,0,0)",
              plot_bgcolor: "rgba(0,0,0,0)",
              font: { color: "#e2e8f0" },
              xaxis: { title: { text: "Data" } },
              yaxis: { title: { text: "Valor (R$)" }, tickprefix: "R$ ", separatethousands: true },
            }}
            style={{ width: "100%", height: "400px" }}
          />

          <Plot
            data={[
              {
                x: Array.from(new Set(empenhosExibidos.map((e) => e.elemdespesatce))),
                y: Array.from(new Set(empenhosExibidos.map((e) => e.elemdespesatce))).map((el) =>
                  empenhosExibidos
                    .filter((e) => e.elemdespesatce === el)
                    .reduce((sum, e) => sum + e.vlr_empenhado, 0)
                ),
                type: "bar",
                marker: { color: "#38bdf8" },
                customdata: Array.from(new Set(empenhosExibidos.map((e) => e.elemdespesatce))).map((el) =>
                  formatCurrencyBR(
                    empenhosExibidos
                      .filter((e) => e.elemdespesatce === el)
                      .reduce((sum, e) => sum + e.vlr_empenhado, 0)
                  )
                ),
                hovertemplate: "%{x}<br>Valor Total: %{customdata}<extra></extra>",
              },
            ]}
            layout={{
              title: { text: "Soma de Valores por Elemento da Despesa", font: { color: "#f8fafc" } },
              paper_bgcolor: "rgba(0,0,0,0)",
              plot_bgcolor: "rgba(0,0,0,0)",
              font: { color: "#e2e8f0" },
              xaxis: { title: { text: "Elemento da Despesa" } },
              yaxis: { title: { text: "Valor Total (R$)" }, tickprefix: "R$ ", separatethousands: true },
            }}
            style={{ width: "100%", height: "400px" }}
          />
        </section>
      </div>
    </div>
  );
};
