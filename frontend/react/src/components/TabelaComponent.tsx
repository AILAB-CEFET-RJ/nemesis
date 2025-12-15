import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { Fracionamento } from "../pages/fracionamento/types";
import { fetchFracionamentos } from "../utils/dataFetcher";
import * as Tooltip from "@radix-ui/react-tooltip";
import { FolderOpen, Home, ArrowLeft, ChevronDown } from "lucide-react";
import { GrupoCharts } from "./GrupoCharts";
import {
  formatCurrencyBR,
  formatNumberBR,
  formatIntegerBR,
  formatDateBR,
} from "../utils/formatters";

interface TabelaComponentProps {
  setAbrirTabela: Dispatch<SetStateAction<boolean>>;
  idUnid: string;
  ano: string;
}

export function TabelaComponent({ setAbrirTabela, idUnid, ano }: TabelaComponentProps) {
  const [tabela, setTabela] = useState<Fracionamento[]>([]);
  const [clusterId, setClusterId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  useEffect(() => {
    if (!idUnid) return;
    const handleTabela = async () => {
      try {
        setLoading(true);
        setError(null);
        const results = await fetchFracionamentos(idUnid, clusterId, ano);
        setTabela(Array.isArray(results) ? results : []);
      } catch (err) {
        setError("Erro ao buscar dados de fracionamento");
      } finally {
        setLoading(false);
      }
    };
    handleTabela();
  }, [idUnid, clusterId]);

  function handleSort(key: string) {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  }

  const sortedTabela = [...tabela].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;

    let valA: any;
    let valB: any;

    if (key === "valorTotal") {
      valA = (a.valor || 0) * (a.cluster_size || 0);
      valB = (b.valor || 0) * (b.cluster_size || 0);
    } else {
      valA = (a as any)[key];
      valB = (b as any)[key];
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

  const grupoSelecionado = clusterId
    ? tabela.find((item) => String(item.cluster_id) === clusterId)
    : null;
  const valorTotalGrupo =
    clusterId !== "" ? tabela.reduce((acc, item) => acc + (item.valor || 0), 0) : 0;

  const totalClusters = useMemo(() => {
    return new Set(tabela.map((item) => item.cluster_id)).size;
  }, [tabela]);

  const ehDetalhe = clusterId !== "";

  return (
    <div className="mx-auto max-w-6xl space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 shadow-lg backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-200">
            análise de fracionamentos
          </p>
          <h2 className="text-2xl font-semibold text-white">
            {ehDetalhe ? `Grupo ${clusterId}` : "Grupos identificados"}
          </h2>
          <p className="text-sm text-slate-300">
            {ehDetalhe
              ? grupoSelecionado
                ? `Tamanho ${formatIntegerBR(grupoSelecionado.cluster_size)} · Valor acumulado ${formatCurrencyBR(
                    valorTotalGrupo
                  )}`
                : "Carregando informações do grupo selecionado."
              : "Selecione um grupo para detalhar os empenhos componentes."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (ehDetalhe) {
                setClusterId("");
                setSortConfig(null);
                return;
              }
              setAbrirTabela(false);
            }}
            className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
          >
            {ehDetalhe ? (
              <>
                <ArrowLeft className="h-4 w-4" /> Voltar aos grupos
              </>
            ) : (
              <>
                <Home className="h-4 w-4" /> Ajustar filtros
              </>
            )}
          </button>
          {!ehDetalhe && (
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-right">
              <p className="text-xs uppercase tracking-wide text-slate-200">Grupos carregados</p>
              <p className="text-xl font-semibold text-white">{formatIntegerBR(totalClusters)}</p>
            </div>
          )}
        </div>
      </div>

      {loading && <p className="text-slate-200">Carregando dados do jurisdicionado...</p>}
      {error && <p className="text-red-400">{error}</p>}
      {!loading && tabela.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">
          Nenhum registro encontrado para os filtros informados.
        </div>
      )}

      {ehDetalhe && tabela.length > 0 && (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300">
                <tr>
                  {["idempenho", "elemdespesatce", "data", "valor", "historico"].map((col) => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="cursor-pointer px-4 py-3 text-left select-none"
                    >
                      <span className="inline-flex items-center gap-2">
                        {col === "idempenho"
                          ? "ID"
                          : col === "elemdespesatce"
                          ? "Elemento da despesa"
                          : col === "data"
                          ? "Data"
                          : col === "valor"
                          ? "Valor"
                          : "Histórico"}
                        {sortConfig?.key === col && (
                          <ChevronDown
                            className={`h-4 w-4 transition ${
                              sortConfig.direction === "asc" ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTabela.map((item: Fracionamento, idx: number) => (
                  <tr
                    key={item.idempenho}
                    className={idx % 2 === 0 ? "bg-white/5" : "bg-white/10"}
                  >
                    <td className="px-4 py-3 font-semibold text-white">{item.idempenho}</td>
                    <td className="px-4 py-3 text-slate-100">{item.elemdespesatce}</td>
                    <td className="px-4 py-3 text-slate-200">
                      {item.data ? formatDateBR(item.data) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-300">
                      {formatCurrencyBR(item.valor)}
                    </td>
                    <td className="px-4 py-3 text-slate-200">{item.historico}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
            <GrupoCharts dados={tabela} />
          </div>
        </div>
      )}

      {!ehDetalhe && tabela.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300">
              <tr>
                {["cluster_id", "cluster_size", "min_sim", "max_sim", "valor", "valorTotal"].map(
                  (col) => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="cursor-pointer px-4 py-3 text-left select-none"
                    >
                      <span className="inline-flex items-center gap-2">
                        {col === "cluster_id"
                          ? "ID do grupo"
                          : col === "cluster_size"
                          ? "Tamanho"
                          : col === "min_sim"
                          ? "Similaridade mínima"
                          : col === "max_sim"
                          ? "Similaridade máxima"
                          : col === "valor"
                          ? "Valor médio"
                          : "Valor total"}
                        {sortConfig?.key === col && (
                          <ChevronDown
                            className={`h-4 w-4 transition ${
                              sortConfig.direction === "asc" ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </span>
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {sortedTabela.map((item: Fracionamento, idx: number) => {
                const valorTotal = (item.valor || 0) * (item.cluster_size || 0);
                return (
                  <tr key={`${item.cluster_id}-${idx}`} className={idx % 2 === 0 ? "bg-white/5" : "bg-white/10"}>
                    <td className="px-4 py-3 text-slate-100">
                      <Tooltip.Provider delayDuration={200}>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setClusterId(String(item.cluster_id));
                                setSortConfig(null);
                              }}
                              className="inline-flex items-center gap-2 text-sky-300 underline-offset-4 hover:underline"
                            >
                              {item.cluster_id}
                              <FolderOpen size={16} />
                            </a>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              side="top"
                              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white shadow-md"
                            >
                              Ver empenhos componentes
                              <Tooltip.Arrow className="fill-slate-900" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </td>
                    <td className="px-4 py-3 text-slate-100 text-right">
                      {formatIntegerBR(item.cluster_size)}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-300">{formatNumberBR(item.min_sim)}</td>
                    <td className="px-4 py-3 text-right text-emerald-300">{formatNumberBR(item.max_sim)}</td>
                    <td className="px-4 py-3 text-right text-slate-100">{formatCurrencyBR(item.valor)}</td>
                    <td className="px-4 py-3 text-right text-sky-200">{formatCurrencyBR(valorTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
