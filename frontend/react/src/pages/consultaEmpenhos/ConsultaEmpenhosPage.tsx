import React, { useState, useEffect } from "react";
import CardItem from "./CardItem";
import SelectPageBar from "./SelectPageBar";
import FiltrosEmpenho from "./FiltrosEmpenho";
import { EmpenhoItem } from "./types";
import { CheckCircle2, Info, Search, Slash, RefreshCw } from "lucide-react";
import { useTranslation } from "../../context/LanguageContext";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

export const ConsultasEmpenhos: React.FC = () => {
  const { t } = useTranslation();
  const [ente, setEnte] = useState("");
  const [unidade, setUnidade] = useState("");
  const [elementoDespesa, setElementoDespesa] = useState("");
  const [credor, setCredor] = useState("");
  const [historico, setHistorico] = useState("");
  const [respostaAPI, setRespostaAPI] = useState<EmpenhoItem[] | null>(null);
  const [loading, setLoading] = useState(false); 
  const [tentativa, setTentativa] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showNotSuccess, setShowNotSuccess] = useState(false);
  const [enteConfigurado, setEnteConfigurado] = useState(false);
  const [unidadeConfigurada, setUnidadeConfigurada] = useState(false);
  const [elemDespesaConfigurado, setElemDespesaConfigurado] = useState(false);
  const [credorConfigurado, setCredorConfigurado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { unidade, elementoDespesa, credor, historico, ente };
    setLoading(true);
    setRespostaAPI(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/consulta_vs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: EmpenhoItem[] = await response.json();
      console.log("Resposta do backend:", data);

      if (Array.isArray(data)) {
        const ordenados = [...data].sort((a, b) => {
          const simA = a.distance ?? -Infinity;
          const simB = b.distance ?? -Infinity;
          return simB - simA;
        });
        setRespostaAPI(ordenados);
      } else {
        setShowNotSuccess(true);
        setRespostaAPI(null);
      }

    } catch (error) {
      console.error("Erro ao enviar:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (respostaAPI && respostaAPI.length > 0) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000); 

      return () => clearTimeout(timer);
    }
    if (respostaAPI && respostaAPI.length == 0){
      setShowNotSuccess(true);
      const timer = setTimeout(() => {
        setShowNotSuccess(false);
      }, 3000); 

      return () => clearTimeout(timer);
    }

  }, [respostaAPI]);


  useEffect(() => {
    if (tentativa) {
      setTentativa(true);
      const timer = setTimeout(() => {
        setTentativa(false);
      }, 3000); 

      return () => clearTimeout(timer);
    }
  }, [tentativa]);

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_60%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-14">
        <header className="text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-300">
            {t("query.badge")}
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">
            {t("query.title")}
          </h1>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            {t("query.subtitle")}
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">{t("query.paramsBadge")}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{t("query.paramsTitle")}</h2>
            <p className="mt-1 text-sm text-slate-300">
              {t("query.paramsSubtitle")}
            </p>

            <div className="mt-6 space-y-4">
              <FiltrosEmpenho
                ente={ente}
                setEnte={setEnte}
                unidade={unidade}
                setUnidade={setUnidade}
                elementoDespesa={elementoDespesa}
                setElementoDespesa={setElementoDespesa}
                credor={credor}
                setCredor={setCredor}
                enteConfigurado={enteConfigurado}
                setEnteConfigurado={setEnteConfigurado}
                unidadeConfigurada={unidadeConfigurada}
                setUnidadeConfigurada={setUnidadeConfigurada}
                elemDespesaConfigurado={elemDespesaConfigurado}
                setElemDespesaConfigurado={setElemDespesaConfigurado}
                credorConfigurado={credorConfigurado}
                setCredorConfigurado={setCredorConfigurado}
              />

              <div>
                <label className="block text-sm font-medium text-slate-200">{t("query.historyLabel")}</label>
                <textarea
                  value={historico}
                  onChange={(e) => setHistorico(e.target.value)}
                  placeholder={t("query.historyPlaceholder")}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-sky-300 focus:bg-white/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={
                !(
                  historico ||
                  enteConfigurado ||
                  unidadeConfigurada ||
                  elemDespesaConfigurado ||
                  credorConfigurado
                )
              }
              className={`mt-8 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
                historico ||
                enteConfigurado ||
                unidadeConfigurada ||
                elemDespesaConfigurado ||
                credorConfigurado
                  ? "bg-sky-400 text-slate-950 hover:bg-sky-300"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
              onClick={(e) => {
                if (
                  !(
                    historico ||
                    enteConfigurado ||
                    unidadeConfigurada ||
                    elemDespesaConfigurado ||
                    credorConfigurado
                  )
                ) {
                  e.preventDefault();
                  setTentativa(true);
                }
              }}
            >
              {t("query.submit")}
              <Search className="h-4 w-4" />
            </button>
          </form>

          <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-sky-400/20 p-2 text-sky-200">
                  <Info className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-300">{t("query.tipTitle")}</p>
                  <p className="text-sm text-white">
                    {t("query.tipHighlight")}
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                  {t("query.tip1")}
                </li>
                <li className="flex items-start gap-2">
                  <Slash className="mt-0.5 h-4 w-4 text-amber-300" />
                  {t("query.tip2")}
                </li>
              </ul>
            </div>

            {tentativa && (
              <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                {t("query.attemptWarn")}
              </div>
            )}

            {showSuccess && (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                {t("query.success")}
              </div>
            )}

            {showNotSuccess && (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {t("query.noResults")}
              </div>
            )}
          </aside>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          {loading && (
            <div className="flex justify-center items-center py-8 text-slate-300">
              <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-sky-400 border-opacity-50" />
              <span className="ml-3">Carregando...</span>
            </div>
          )}

          {!loading && respostaAPI && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3">
                <SelectPageBar numEmpenhos={respostaAPI.length} itensPorPagina={10} />
                <div className="text-sm font-semibold text-slate-100">
                  {respostaAPI.length} {t("query.results")}
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/40"
                  onClick={() => {
                    setRespostaAPI(null);
                    setShowSuccess(false);
                    setShowNotSuccess(false);
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  {t("query.clearPanel")}
                </button>
              </div>

              <CardItem empenhos={respostaAPI} />
            </div>
          )}

          {!loading && !respostaAPI && (
            <div className="rounded-2xl border border-dashed border-white/20 px-4 py-6 text-center text-sm text-slate-300">
              {t("query.pendingPanel")}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
