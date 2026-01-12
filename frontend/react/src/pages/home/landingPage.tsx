import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  SearchCheck,
  Sparkles,
  GitMerge
} from "lucide-react";
import { useTranslation } from "../../context/LanguageContext";

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const quickLinks = [
    {
      title: t("landing.links.queryTitle"),
      description: t("landing.links.queryDesc"),
      to: "/query",
      icon: SearchCheck,
    },
    {
      title: t("landing.links.overpriceTitle"),
      description: t("landing.links.overpriceDesc"),
      to: "/sobrepreco",
      icon: Sparkles,
    },
    {
      title: t("landing.links.fractionTitle"),
      description: t("landing.links.fractionDesc"),
      to: "/tabela_fracionamento",
      icon: BarChart3,
    },
    {
      title: t("landing.links.variabilityTitle"),
      description: t("landing.links.variabilityDesc"),
      to: "/variabilidade-semantica",
      icon: GitMerge,
    },
  ];
  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_60%)]" />
      </div>

      <div className="relative z-10 px-6 py-16 sm:py-20 lg:px-16">
        <div className="mx-auto max-w-5xl space-y-16">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-300">{t("landing.badge")}</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl">
              NEMESIS
            </h1>
            <p className="mt-4 text-base text-slate-200">
              {t("landing.tagline")}
            </p>
            <p className="mt-6 text-sm text-slate-300">
              {t("landing.subTagline")}
            </p>
          </section>

          <section>
            <div className="mx-auto max-w-4xl grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg transition hover:border-sky-400/60 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="rounded-xl bg-white/10 p-2 text-sky-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-white/50 transition group-hover:translate-x-1 group-hover:text-sky-200" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-300">{item.description}</p>
                    <span className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {t("common.openModule")}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
