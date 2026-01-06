import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { Fracionamento, EmpenhoDetalhe } from "../pages/fracionamento/types";
import { fetchFracionamentos, fetchEmpenhoDetalhe } from "../utils/dataFetcher";
import * as Tooltip from "@radix-ui/react-tooltip";
import { FolderOpen, Home, ArrowLeft, ChevronDown } from "lucide-react";
import { GrupoCharts } from "./GrupoCharts";
import { useTranslation } from "../context/LanguageContext";
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
  enteLabel: string;
  unidadeLabel: string;
}

export function TabelaComponent({ setAbrirTabela, idUnid, ano, enteLabel, unidadeLabel }: TabelaComponentProps) {
  const [tabela, setTabela] = useState<Fracionamento[]>([]);
  const [clusterId, setClusterId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [detalheEmpenho, setDetalheEmpenho] = useState<EmpenhoDetalhe | null>(null);
  const [detalheLoading, setDetalheLoading] = useState(false);
  const [detalheErro, setDetalheErro] = useState<string | null>(null);
  const [idempenhoSelecionado, setIdempenhoSelecionado] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!idUnid) return;
    const handleTabela = async () => {
      try {
        setLoading(true);
        setError(null);
        const results = await fetchFracionamentos(idUnid, clusterId, ano);
        setTabela(Array.isArray(results) ? results : []);
      } catch (err) {
        setError(t("fractionation.loadError"));
      } finally {
        setLoading(false);
      }
    };
    handleTabela();
  }, [idUnid, clusterId]);

  useEffect(() => {
    const fetchDetalhe = async () => {
      if (!idempenhoSelecionado) {
        setDetalheEmpenho(null);
        return;
      }
      try {
        setDetalheLoading(true);
        setDetalheErro(null);
        const data = await fetchEmpenhoDetalhe(idempenhoSelecionado);
        setDetalheEmpenho(data);
      } catch (err) {
        setDetalheErro(t("fractionation.loadError"));
      } finally {
        setDetalheLoading(false);
      }
    };
    fetchDetalhe();
  }, [idempenhoSelecionado]);

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
  const detailHeaders: Record<string, string> = {
    idempenho: t("fractionation.tableColumns.id"),
    elemdespesatce: t("fractionation.tableColumns.element"),
    data: t("fractionation.tableColumns.date"),
    valor: t("fractionation.tableColumns.value"),
    historico: t("fractionation.tableColumns.history"),
  };
  const summaryHeaders: Record<string, string> = {
    cluster_id: t("fractionation.tableColumns.groupId"),
    cluster_size: t("fractionation.tableColumns.size"),
    min_sim: t("fractionation.tableColumns.minSim"),
    max_sim: t("fractionation.tableColumns.maxSim"),
    valor: t("fractionation.tableColumns.avgValue"),
    valorTotal: t("fractionation.tableColumns.totalValue"),
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 shadow-lg backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-200">
            {t("fractionation.tableBadge")}
          </p>
          <h2 className="text-2xl font-semibold text-white">
            {ehDetalhe ? t("fractionation.tableTitleGroup", undefined, { id: clusterId }) : t("fractionation.tableTitleGroups")}
          </h2>
          <p className="text-sm text-slate-300">
            {ehDetalhe
              ? grupoSelecionado
                ? t("fractionation.tableSubtitleGroup", undefined, {
                    size: formatIntegerBR(grupoSelecionado.cluster_size),
                    value: formatCurrencyBR(valorTotalGrupo),
                  })
                : t("common.loading")
              : t("fractionation.tableSubtitleGroups")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-200">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {t("fractionation.field.municipality")}: <span className="font-semibold text-white">{enteLabel || t("common.notDefined")}</span>
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {t("fractionation.field.jurisdiction")}: <span className="font-semibold text-white">{unidadeLabel || t("common.notDefined")}</span>
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {t("fractionation.field.year")}: <span className="font-semibold text-white">{ano || t("common.notDefined")}</span>
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {t("fractionation.field.idunid")}: <span className="font-semibold text-white">{idUnid || t("common.notDefined")}</span>
            </span>
          </div>
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
                <ArrowLeft className="h-4 w-4" /> {t("fractionation.backToGroups")}
              </>
            ) : (
              <>
                <Home className="h-4 w-4" /> {t("fractionation.adjustFilters")}
              </>
            )}
          </button>
          {!ehDetalhe && (
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-right">
              <p className="text-xs uppercase tracking-wide text-slate-200">{t("fractionation.groupsLoaded")}</p>
              <p className="text-xl font-semibold text-white">{formatIntegerBR(totalClusters)}</p>
            </div>
          )}
        </div>
      </div>

      {loading && <p className="text-slate-200">{t("fractionation.loadingData")}</p>}
      {error && <p className="text-red-400">{error}</p>}
      {!loading && tabela.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">
          {t("fractionation.noRecords")}
        </div>
      )}

      {idempenhoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{t("fractionation.commitmentDetails", undefined, { id: idempenhoSelecionado || "" })}</h3>
              <button
                onClick={() => {
                  setIdempenhoSelecionado(null);
                  setDetalheEmpenho(null);
                }}
                className="rounded-full border border-white/20 px-3 py-1 text-sm text-slate-200 hover:border-white/40"
              >
                {t("common.close")}
              </button>
            </div>
            {detalheLoading && <p className="text-slate-300">{t("common.loading")}</p>}
            {detalheErro && <p className="text-red-400">{detalheErro}</p>}
            {detalheEmpenho && (
              <dl className="grid grid-cols-2 gap-3 text-sm text-slate-200">
                <div><dt className="text-xs text-slate-400">{t("fractionation.field.year")}</dt><dd className="font-semibold text-white">{detalheEmpenho.ano}</dd></div>
                <div><dt className="text-xs text-slate-400">{t("fractionation.field.date")}</dt><dd className="font-semibold text-white">{detalheEmpenho.dtempenho}</dd></div>
                <div><dt className="text-xs text-slate-400">{t("fractionation.field.municipality")}</dt><dd className="font-semibold text-white">{detalheEmpenho.ente}</dd></div>
                <div><dt className="text-xs text-slate-400">{t("fractionation.field.jurisdiction")}</dt><dd className="font-semibold text-white">{detalheEmpenho.unidade}</dd></div>
                <div><dt className="text-xs text-slate-400">{t("fractionation.field.idunid")}</dt><dd className="font-semibold text-white">{detalheEmpenho.idunid}</dd></div>
                <div><dt className="text-xs text-slate-400">{t("fractionation.field.element")}</dt><dd className="font-semibold text-white">{detalheEmpenho.elemdespesatce}</dd></div>
                <div><dt className="text-xs text-slate-400">{t("fractionation.field.creditor")}</dt><dd className="font-semibold text-white">{detalheEmpenho.credor}</dd></div>
                <div><dt className="text-xs text-slate-400">{t("fractionation.field.value")}</dt><dd className="font-semibold text-emerald-300">{formatCurrencyBR(detalheEmpenho.valor)}</dd></div>
                <div className="col-span-2">
                  <dt className="text-xs text-slate-400">{t("fractionation.field.history")}</dt>
                  <dd className="mt-1 rounded-lg bg-white/5 p-3 text-white">{detalheEmpenho.historico}</dd>
                </div>
              </dl>
            )}
          </div>
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
                        {detailHeaders[col]}
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
                    <td className="px-4 py-3 font-semibold text-white">
                      <button
                        className="text-sky-300 underline-offset-4 hover:underline"
                        onClick={() => setIdempenhoSelecionado(item.idempenho)}
                      >
                        {item.idempenho}
                      </button>
                    </td>
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
                        {summaryHeaders[col]}
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
                              {t("fractionation.tableColumns.viewCommitments")}
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
