import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Layers3,
  SearchCheck,
  ShieldCheck,
  Sparkles
} from "lucide-react";

const quickLinks = [
  {
    title: "Análise de Sobrepreço",
    description: "Detecte indícios com filtro inteligente e gráficos interativos.",
    to: "/sobrepreco",
    icon: Sparkles,
  },
  {
    title: "Consulta de Empenhos",
    description: "Pesquise e combine filtros textuais sobre notas de empenho.",
    to: "/query",
    icon: SearchCheck,
  },
  {
    title: "Projeção 3D",
    description: "Explore a rede de empenhos com profundidade espacial.",
    to: "/visualizer",
    icon: Layers3,
  },
  {
    title: "Fracionamentos",
    description: "Acompanhe suspeitas de divisão indevida de despesas.",
    to: "/tabela_fracionamento",
    icon: BarChart3,
  },
];

export const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_60%)]" />
      </div>

      <div className="relative z-10 px-6 py-16 sm:py-20 lg:px-16">
        <div className="mx-auto max-w-5xl space-y-16">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-300">plataforma de auditoria</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl">
              NEMESIS
            </h1>
            <p className="mt-4 text-base text-slate-200">
              Notas de Empenho com Estratégia Semântica e Inteligência de Sistemas
            </p>
            <p className="mt-6 text-sm text-slate-300">
              Investigações guiadas por IA para acelerar o trabalho do auditor público.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                to="/sobrepreco"
                className="inline-flex items-center justify-center rounded-full bg-sky-400 px-8 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              >
                Iniciar análise de sobrepreço
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/query"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3 text-sm font-semibold text-slate-50 transition hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                Revisar consultas existentes
              </Link>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">Novidades</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Filtro inteligente para sobrepreço</h2>
              <p className="mt-2 text-sm text-slate-200">
                Resultados ranqueados por embeddings e revisados por LLM, com troca rápida entre lista completa e itens aprovados.
              </p>
              <ul className="mt-4 space-y-3 text-left text-sm text-slate-200">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Alternância instantânea entre dados brutos e filtrados.
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-300" />
                  Transparência com explicação do modelo e contagem de itens avaliados.
                </li>
              </ul>
            </article>

            <article className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-6 shadow-xl backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-widest text-sky-300">Próximos passos</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Priorize onde investigar</h2>
              <p className="mt-2 text-sm text-slate-200">
                Use a projeção 3D para encontrar clusters suspeitos e aprofunde com as consultas consolidadas da base.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-left text-sm text-slate-200">
                <div className="rounded-xl border border-white/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Bases ativas</p>
                  <p className="text-xl font-semibold text-white">4</p>
                </div>
                <div className="rounded-xl border border-white/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Alertas recentes</p>
                  <p className="text-xl font-semibold text-white">18</p>
                </div>
              </div>
            </article>
          </section>

          <section>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                      Abrir módulo
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
