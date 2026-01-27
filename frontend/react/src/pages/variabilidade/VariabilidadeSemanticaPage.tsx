import React, { useMemo, useState } from "react";
import {
  ClipboardList,
  Compass,
  ShieldAlert,
  SlidersHorizontal,
  BarChart3,
  HelpCircle,
} from "lucide-react";
import { useTranslation } from "../../context/LanguageContext";
import {
  fetchVariabilidadeSemantica,
  fetchVariabilidadeEmpenhos,
  VariabilidadeEmpenhoItem,
  VariabilidadeSemanticaItem,
} from "../../utils/dataFetcher";
import { formatCurrencyBR, formatDateBR, formatNumberBR } from "../../utils/formatters";

type SortKey = "group_key" | "cnpjraiz" | "n_empenhos" | "semantic_variability" | "mean_date" | "total_value";

export const VariabilidadeSemanticaPage: React.FC = () => {
  const { t } = useTranslation();
  const [groupBy, setGroupBy] = useState<"ente" | "jurisdicionado">("ente");
  const [minN, setMinN] = useState<number>(5);
  const [maxN, setMaxN] = useState<number>(50);
  const [limit, setLimit] = useState<number>(200);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [data, setData] = useState<VariabilidadeSemanticaItem[]>([]);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [empenhosOpen, setEmpenhosOpen] = useState(false);
  const [empenhosData, setEmpenhosData] = useState<VariabilidadeEmpenhoItem[]>([]);
  const [empenhosLoading, setEmpenhosLoading] = useState(false);
  const [empenhosError, setEmpenhosError] = useState<string | null>(null);
  const [empenhosOffset, setEmpenhosOffset] = useState(0);
  const defaultEmpenhosOrderBy: "dtempenho" = "dtempenho";
  const defaultEmpenhosOrderDir: "desc" = "desc";
  const [empenhosSortConfig, setEmpenhosSortConfig] = useState<{
    key: "idempenho" | "dtempenho" | "credor" | "elemdespesatce" | "vlr_empenhado" | "historico";
    direction: "asc" | "desc";
  }>({ key: "dtempenho", direction: "desc" });
  const [empenhosQuery, setEmpenhosQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<VariabilidadeSemanticaItem | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "semantic_variability",
    direction: "desc",
  });

  const optionStyle = { color: "#0f172a", backgroundColor: "#e2e8f0" };
  const groupLabel = groupBy === "ente" ? t("semanticVariability.groupByEnte") : t("semanticVariability.groupByJurisdicionado");
  const formatGroupValue = (row: VariabilidadeSemanticaItem) => row.group_label || row.group_key;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const results = await fetchVariabilidadeSemantica(groupBy, minN, maxN, limit, offset);
    setData(results);
    setHasFetched(true);
    setLoading(false);
  };

  const sortedData = useMemo(() => {
    const copy = [...data];
    const { key, direction } = sortConfig;
    copy.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (key === "mean_date") {
        const timeA = new Date(String(valA)).getTime();
        const timeB = new Date(String(valB)).getTime();
        return direction === "asc" ? timeA - timeB : timeB - timeA;
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return direction === "asc" ? valA - valB : valB - valA;
      }
      return direction === "asc"
        ? String(valA).localeCompare(String(valB), "pt-BR")
        : String(valB).localeCompare(String(valA), "pt-BR");
    });
    return copy;
  }, [data, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIndicator = (key: SortKey) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  const formatVariability = (value: number | null) => {
    if (value == null) return "—";
    return formatNumberBR(value);
  };

  const toggleTooltip = (key: string) => {
    setActiveTooltip((prev) => (prev === key ? null : key));
  };

  const pageSize = 50;

  const loadEmpenhos = async (
    row: VariabilidadeSemanticaItem,
    newOffset = 0,
    orderBy = defaultEmpenhosOrderBy,
    orderDir = defaultEmpenhosOrderDir
  ) => {
    setEmpenhosLoading(true);
    setEmpenhosError(null);
    const result = await fetchVariabilidadeEmpenhos(
      groupBy,
      String(row.group_key),
      row.cnpjraiz,
      pageSize,
      newOffset,
      orderBy,
      orderDir
    );
    setEmpenhosData(result);
    setEmpenhosOffset(newOffset);
    setEmpenhosLoading(false);
  };

  const openEmpenhos = async (row: VariabilidadeSemanticaItem) => {
    setSelectedGroup(row);
    setEmpenhosQuery("");
    setEmpenhosSortConfig({ key: "dtempenho", direction: "desc" });
    setEmpenhosOpen(true);
    await loadEmpenhos(row, 0, defaultEmpenhosOrderBy, defaultEmpenhosOrderDir);
  };

  const closeEmpenhos = () => {
    setEmpenhosOpen(false);
    setEmpenhosData([]);
    setEmpenhosError(null);
    setSelectedGroup(null);
  };

  const filteredEmpenhos = empenhosQuery.trim()
    ? empenhosData.filter((item) => {
        const needle = empenhosQuery.toLowerCase();
        return (
          String(item.idempenho ?? "").toLowerCase().includes(needle) ||
          String(item.credor ?? "").toLowerCase().includes(needle) ||
          String(item.historico ?? "").toLowerCase().includes(needle)
        );
      })
    : empenhosData;

  const singleCredor = useMemo(() => {
    if (!empenhosData.length) return null;
    const unique = Array.from(
      new Set(empenhosData.map((item) => (item.credor ?? "").trim()).filter(Boolean))
    );
    return unique.length === 1 ? unique[0] : null;
  }, [empenhosData]);

  const showCredorColumn = !singleCredor;

  const sortedEmpenhos = useMemo(() => {
    const copy = [...filteredEmpenhos];
    const { key, direction } = empenhosSortConfig;
    copy.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (key === "dtempenho") {
        const timeA = new Date(String(valA)).getTime();
        const timeB = new Date(String(valB)).getTime();
        return direction === "asc" ? timeA - timeB : timeB - timeA;
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return direction === "asc" ? valA - valB : valB - valA;
      }
      return direction === "asc"
        ? String(valA).localeCompare(String(valB), "pt-BR")
        : String(valB).localeCompare(String(valA), "pt-BR");
    });
    return copy;
  }, [filteredEmpenhos, empenhosSortConfig]);

  const handleEmpenhosSort = (key: typeof empenhosSortConfig.key) => {
    setEmpenhosSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const getEmpenhosSortIndicator = (key: typeof empenhosSortConfig.key) => {
    if (empenhosSortConfig.key !== key) return "↕";
    return empenhosSortConfig.direction === "asc" ? "▲" : "▼";
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_60%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-14">
        <header className="text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-300">
            {t("semanticVariability.badge")}
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">
            {t("semanticVariability.title")}
          </h1>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            {t("semanticVariability.subtitle")}
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
              {t("semanticVariability.configBadge")}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{t("semanticVariability.configTitle")}</h2>
            <p className="mt-1 text-sm text-slate-300">{t("semanticVariability.configSubtitle")}</p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-200">
                  {t("semanticVariability.groupBy")}
                  <button
                    type="button"
                    className="ml-2 inline-flex items-center text-slate-400 hover:text-slate-200"
                    title={t("semanticVariability.tooltip.groupBy")}
                    aria-label={t("semanticVariability.tooltip.groupBy")}
                    aria-expanded={activeTooltip === "groupBy"}
                    onClick={() => toggleTooltip("groupBy")}
                  >
                    <HelpCircle className="h-4 w-4" aria-hidden="true" />
                  </button>
                </label>
                {activeTooltip === "groupBy" && (
                  <p className="mt-2 text-xs text-slate-400">{t("semanticVariability.tooltip.groupBy")}</p>
                )}
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as "ente" | "jurisdicionado")}
                  disabled={loading}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-sky-300 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <option value="ente" style={optionStyle}>{t("semanticVariability.groupByEnte")}</option>
                  <option value="jurisdicionado" style={optionStyle}>{t("semanticVariability.groupByJurisdicionado")}</option>
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-200">
                    {t("semanticVariability.minN")}
                    <button
                      type="button"
                      className="ml-2 inline-flex items-center text-slate-400 hover:text-slate-200"
                      title={t("semanticVariability.tooltip.minN")}
                      aria-label={t("semanticVariability.tooltip.minN")}
                      aria-expanded={activeTooltip === "minN"}
                      onClick={() => toggleTooltip("minN")}
                    >
                      <HelpCircle className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </label>
                  {activeTooltip === "minN" && (
                    <p className="mt-2 text-xs text-slate-400">{t("semanticVariability.tooltip.minN")}</p>
                  )}
                  <input
                    type="number"
                    min={2}
                    value={minN}
                    onChange={(e) => {
                      const nextMin = Number(e.target.value);
                      setMinN(nextMin);
                      if (nextMin > maxN) {
                        setMaxN(nextMin);
                      }
                    }}
                    disabled={loading}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-sky-300 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200">
                    {t("semanticVariability.maxN")}
                    <button
                      type="button"
                      className="ml-2 inline-flex items-center text-slate-400 hover:text-slate-200"
                      title={t("semanticVariability.tooltip.maxN")}
                      aria-label={t("semanticVariability.tooltip.maxN")}
                      aria-expanded={activeTooltip === "maxN"}
                      onClick={() => toggleTooltip("maxN")}
                    >
                      <HelpCircle className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </label>
                  {activeTooltip === "maxN" && (
                    <p className="mt-2 text-xs text-slate-400">{t("semanticVariability.tooltip.maxN")}</p>
                  )}
                  <input
                    type="number"
                    min={2}
                    value={maxN}
                    onChange={(e) => {
                      const nextMax = Number(e.target.value);
                      setMaxN(nextMax);
                      if (nextMax < minN) {
                        setMinN(nextMax);
                      }
                    }}
                    disabled={loading}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-sky-300 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200">
                    {t("semanticVariability.limit")}
                    <button
                      type="button"
                      className="ml-2 inline-flex items-center text-slate-400 hover:text-slate-200"
                      title={t("semanticVariability.tooltip.limit")}
                      aria-label={t("semanticVariability.tooltip.limit")}
                      aria-expanded={activeTooltip === "limit"}
                      onClick={() => toggleTooltip("limit")}
                    >
                      <HelpCircle className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </label>
                  {activeTooltip === "limit" && (
                    <p className="mt-2 text-xs text-slate-400">{t("semanticVariability.tooltip.limit")}</p>
                  )}
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    disabled={loading}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-sky-300 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">
                  {t("semanticVariability.offset")}
                  <button
                    type="button"
                    className="ml-2 inline-flex items-center text-slate-400 hover:text-slate-200"
                    title={t("semanticVariability.tooltip.offset")}
                    aria-label={t("semanticVariability.tooltip.offset")}
                    aria-expanded={activeTooltip === "offset"}
                    onClick={() => toggleTooltip("offset")}
                  >
                    <HelpCircle className="h-4 w-4" aria-hidden="true" />
                  </button>
                </label>
                {activeTooltip === "offset" && (
                  <p className="mt-2 text-xs text-slate-400">{t("semanticVariability.tooltip.offset")}</p>
                )}
                <input
                  type="number"
                  min={0}
                  value={offset}
                  onChange={(e) => setOffset(Number(e.target.value))}
                  disabled={loading}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-sky-300 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`mt-8 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
                loading
                  ? "bg-slate-700 text-slate-400 cursor-wait"
                  : "bg-sky-400 text-slate-950 hover:bg-sky-300"
              }`}
            >
              {t("semanticVariability.submit")}
              <SlidersHorizontal className="h-4 w-4" />
            </button>

            {error && (
              <p className="mt-4 text-sm text-rose-300">{error}</p>
            )}
          </form>

          <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-sky-400/20 p-2 text-sky-200">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    {t("semanticVariability.currentSelection")}
                  </p>
                  <p className="text-sm text-white">{groupLabel}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                {t("semanticVariability.summary", undefined, { min_n: minN, max_n: maxN, limit, offset })}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-rose-400/20 p-2 text-rose-200">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    {t("semanticVariability.disclaimerTitle")}
                  </p>
                  <p className="text-sm text-white">{t("semanticVariability.disclaimer")}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-semibold text-white">{t("semanticVariability.analysisFlow")}</h3>
              <ul className="mt-3 space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <Compass className="mt-0.5 h-4 w-4 text-emerald-300" />
                  {t("semanticVariability.flow1")}
                </li>
                <li className="flex items-start gap-2">
                  <BarChart3 className="mt-0.5 h-4 w-4 text-sky-300" />
                  {t("semanticVariability.flow2")}
                </li>
              </ul>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
                {t("semanticVariability.resultsBadge")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {t("semanticVariability.resultsTitle")}
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                {t("semanticVariability.resultsSubtitle")}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              {t("semanticVariability.resultsCount", undefined, { total: data.length })}
            </div>
          </div>

          {!hasFetched && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
              {t("semanticVariability.pending")}
            </div>
          )}

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-slate-200">
              <div className="h-8 w-8 animate-spin rounded-full border-t-4 border-rose-400 border-opacity-60" />
              <div className="flex flex-col">
                <span>{t("common.loading")}</span>
                <span className="text-xs text-slate-400">{t("semanticVariability.loadingNote")}</span>
              </div>
            </div>
          )}

          {hasFetched && !loading && data.length === 0 && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
              {t("semanticVariability.noResults")}
            </div>
          )}

          {hasFetched && !loading && data.length > 0 && (
            <>
              <div className="mt-6 overflow-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-white/10 text-left text-xs uppercase tracking-wide text-slate-300">
                    <tr>
                      <th className="px-4 py-3">
                        <button className="flex items-center gap-2" onClick={() => handleSort("group_key")}>
                          {groupLabel} {getSortIndicator("group_key")}
                        </button>
                      </th>
                      <th className="px-4 py-3">
                        <button className="flex items-center gap-2" onClick={() => handleSort("cnpjraiz")}>
                          {t("semanticVariability.tableCnpj")} {getSortIndicator("cnpjraiz")}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button className="flex items-center gap-2 justify-end" onClick={() => handleSort("n_empenhos")}>
                          {t("semanticVariability.tableCount")} {getSortIndicator("n_empenhos")}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button className="flex items-center gap-2 justify-end" onClick={() => handleSort("semantic_variability")}>
                          {t("semanticVariability.tableVariability")} {getSortIndicator("semantic_variability")}
                        </button>
                      </th>
                      <th className="px-4 py-3">
                        <button className="flex items-center gap-2" onClick={() => handleSort("mean_date")}>
                          {t("semanticVariability.tableMeanDate")} {getSortIndicator("mean_date")}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button className="flex items-center gap-2 justify-end" onClick={() => handleSort("total_value")}>
                          {t("semanticVariability.tableTotalValue")} {getSortIndicator("total_value")}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">{t("semanticVariability.tableCommitments")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {sortedData.map((row) => {
                      const rowKey = `${row.group_key}-${row.cnpjraiz}`;
                      return (
                        <tr key={rowKey} className="text-slate-100">
                          <td className="px-4 py-3 font-medium">{formatGroupValue(row)}</td>
                          <td className="px-4 py-3">{row.cnpjraiz}</td>
                          <td className="px-4 py-3 text-right">{row.n_empenhos}</td>
                          <td className="px-4 py-3 text-right">{formatVariability(row.semantic_variability)}</td>
                          <td className="px-4 py-3">
                            {row.mean_date ? formatDateBR(row.mean_date) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {row.total_value != null ? formatCurrencyBR(row.total_value) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => openEmpenhos(row)}
                              className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200 hover:border-sky-300 hover:text-white transition"
                            >
                              {t("semanticVariability.commitmentsButton")}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      {empenhosOpen && selectedGroup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeEmpenhos}
        >
          <div
            className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
                  {t("semanticVariability.commitmentsTitle")}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  {groupLabel} · {formatGroupValue(selectedGroup)}
                </h3>
                <p className="mt-1 text-sm text-slate-300">
                  {t("semanticVariability.commitmentsSubtitle", undefined, { total: selectedGroup.n_empenhos })}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-300">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    {t("semanticVariability.commitmentsCnpj")}:{" "}
                    <span className="text-slate-100">{selectedGroup.cnpjraiz}</span>
                  </span>
                  {singleCredor && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {t("semanticVariability.commitmentsCredor")}:{" "}
                      <span className="text-slate-100">{singleCredor}</span>
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={closeEmpenhos}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-200 hover:border-white/40"
              >
                {t("common.close")}
              </button>
            </div>

            <div className="mt-6">
              <div>
                <label className="block text-sm font-medium text-slate-200">
                  {t("semanticVariability.commitmentsSearch")}
                </label>
                <input
                  type="text"
                  value={empenhosQuery}
                  onChange={(e) => setEmpenhosQuery(e.target.value)}
                  placeholder={t("semanticVariability.commitmentsSearchPlaceholder")}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-sky-300 focus:bg-white/10"
                />
              </div>
            </div>

            {empenhosLoading && (
              <div className="mt-6 flex items-center gap-3 text-slate-200">
                <div className="h-7 w-7 animate-spin rounded-full border-t-4 border-sky-300 border-opacity-60" />
                <span>{t("common.loading")}</span>
              </div>
            )}

            {empenhosError && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-rose-300">
                {empenhosError}
              </div>
            )}

            {!empenhosLoading && !empenhosError && (
              <div className="mt-6 overflow-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-white/10 text-left text-xs uppercase tracking-wide text-slate-300">
                    <tr>
                      <th
                        className="px-4 py-3 cursor-pointer select-none"
                        onClick={() => handleEmpenhosSort("idempenho")}
                      >
                        <span className="flex items-center gap-2">
                          {t("semanticVariability.commitmentsTableId")} {getEmpenhosSortIndicator("idempenho")}
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 cursor-pointer select-none"
                        onClick={() => handleEmpenhosSort("dtempenho")}
                      >
                        <span className="flex items-center gap-2">
                          {t("semanticVariability.commitmentsTableDate")} {getEmpenhosSortIndicator("dtempenho")}
                        </span>
                      </th>
                      <th className="px-4 py-3">{t("semanticVariability.commitmentsTableUnidade")}</th>
                      {showCredorColumn && (
                        <th
                          className="px-4 py-3 cursor-pointer select-none"
                          onClick={() => handleEmpenhosSort("credor")}
                        >
                          <span className="flex items-center gap-2">
                            {t("semanticVariability.commitmentsTableCredor")} {getEmpenhosSortIndicator("credor")}
                          </span>
                        </th>
                      )}
                      <th
                        className="px-4 py-3 cursor-pointer select-none"
                        onClick={() => handleEmpenhosSort("elemdespesatce")}
                      >
                        <span className="flex items-center gap-2">
                          {t("semanticVariability.commitmentsTableElement")} {getEmpenhosSortIndicator("elemdespesatce")}
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 text-right cursor-pointer select-none"
                        onClick={() => handleEmpenhosSort("vlr_empenhado")}
                      >
                        <span className="flex items-center gap-2 justify-end">
                          {t("semanticVariability.commitmentsTableValue")} {getEmpenhosSortIndicator("vlr_empenhado")}
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 cursor-pointer select-none"
                        onClick={() => handleEmpenhosSort("historico")}
                      >
                        <span className="flex items-center gap-2">
                          {t("semanticVariability.commitmentsTableHistory")} {getEmpenhosSortIndicator("historico")}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {sortedEmpenhos.map((item) => (
                      <tr key={item.id} className="text-slate-100">
                        <td className="px-4 py-3 font-medium">{item.idempenho}</td>
                      <td className="px-4 py-3">
                        {item.dtempenho ? formatDateBR(item.dtempenho) : "—"}
                      </td>
                      <td className="px-4 py-3">{item.unidade ?? "—"}</td>
                      {showCredorColumn && (
                        <td className="px-4 py-3">{item.credor ?? "—"}</td>
                      )}
                        <td className="px-4 py-3">{item.elemdespesatce ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          {item.vlr_empenhado != null ? formatCurrencyBR(item.vlr_empenhado) : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-200">{item.historico ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                {t("semanticVariability.commitmentsPage", undefined, { offset: empenhosOffset, limit: pageSize })}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={empenhosOffset === 0 || empenhosLoading}
                  onClick={() => loadEmpenhos(selectedGroup, Math.max(0, empenhosOffset - pageSize))}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    empenhosOffset === 0 || empenhosLoading
                      ? "border-white/10 text-slate-500 cursor-not-allowed"
                      : "border-white/20 text-slate-200 hover:border-sky-300"
                  }`}
                >
                  {t("semanticVariability.commitmentsPrev")}
                </button>
                <button
                  type="button"
                  disabled={empenhosData.length < pageSize || empenhosLoading}
                  onClick={() => loadEmpenhos(selectedGroup, empenhosOffset + pageSize)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    empenhosData.length < pageSize || empenhosLoading
                      ? "border-white/10 text-slate-500 cursor-not-allowed"
                      : "border-white/20 text-slate-200 hover:border-sky-300"
                  }`}
                >
                  {t("semanticVariability.commitmentsNext")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
