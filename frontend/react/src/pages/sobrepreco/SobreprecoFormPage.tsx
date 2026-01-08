import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../context/LanguageContext";
import { ClipboardList, Compass, FileSearch, Layers } from "lucide-react";

export const SobreprecoFormPage: React.FC = () => {
  const [ano, setAno] = useState("2019");
  const [descricao, setDescricao] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();
  const optionStyle = { color: "#0f172a", backgroundColor: "#e2e8f0" };
  const descriptionDisplay = descricao.trim()
    ? descricao
    : t("overpricing.awaitingTerm");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      alert("Por favor, digite uma descrição para análise.");
      return;
    }
    navigate(
      `/sobrepreco/resultados?ano=${ano}&descricao=${encodeURIComponent(descricao)}`
    );
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_60%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-14">
        <header className="text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-300">
            {t("overpricing.badge")}
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">
            {t("overpricing.title")}
          </h1>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            {t("overpricing.subtitle")}
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
              {t("overpricing.configBadge")}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{t("overpricing.configTitle")}</h2>
            <p className="mt-1 text-sm text-slate-300">{t("overpricing.configSubtitle")}</p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-200">
                  {t("overpricing.year")}
                </label>
                <select
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-sky-300 focus:bg-white/10"
                >
                  <option value="2018" style={optionStyle}>2018</option>
                  <option value="2019" style={optionStyle}>2019</option>
                  <option value="2020" style={optionStyle}>2020</option>
                  <option value="2021" style={optionStyle}>2021</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">
                  {t("overpricing.description")}
                </label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder={t("overpricing.descriptionPlaceholder")}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-sky-300 focus:bg-white/10"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            >
              {t("overpricing.submit")}
              <FileSearch className="h-4 w-4" />
            </button>
          </form>

          <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-sky-400/20 p-2 text-sky-200">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    {t("overpricing.currentSelection")}
                  </p>
                  <p className="text-sm text-white">
                    {t("overpricing.yearLabel")} {ano}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                {t("overpricing.descriptionLabel")} {descricao}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-semibold text-white">{t("overpricing.analysisFlow")}</h3>
              <ul className="mt-3 space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <Compass className="mt-0.5 h-4 w-4 text-emerald-300" />
                  {t("overpricing.flow1")}
                </li>
                <li className="flex items-start gap-2">
                  <Layers className="mt-0.5 h-4 w-4 text-sky-300" />
                  {t("overpricing.flow2")}
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
};
