import React, { useMemo, useState } from "react";
import { TabelaComponent } from "../../components/TabelaComponent";
import { ClipboardList, Compass, Layers, ChevronRight } from "lucide-react";
import { useUnidades } from "../../context/UnidadesContext";

export const Fracionamentos: React.FC = () => {
  const [ente, setEnte] = useState<string>("");
  const [unidade, setUnidade] = useState<string>("");
  const [ano, setAno] = useState<string>("");
  const [idUnid, setIdUnid] = useState<string>("");
  const [enteConfigurado, setEnteConfigurado] = useState(false);
  const [unidadeConfigurada, setUnidadeConfigurada] = useState(false);
  const [anoConfigurado, setAnoConfigurado] = useState(false);
  const [abrirTabela, setAbrirTabela] = useState(false);

  const { unidades, loading: carregandoUnidades } = useUnidades();
  const municipios = useMemo(() => Object.keys(unidades || {}).sort(), [unidades]);
  const jurisdicionadosDisponiveis = useMemo(() => {
    if (!ente || !unidades[ente]) return [];
    return [...unidades[ente]].sort((a, b) => a[0].localeCompare(b[0]));
  }, [ente, unidades]);

  const filtrosProntos = enteConfigurado && unidadeConfigurada && anoConfigurado;
  const optionStyle = { color: "#0f172a", backgroundColor: "#e2e8f0" };

  if (abrirTabela) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 sm:p-8">
        <TabelaComponent
          setAbrirTabela={setAbrirTabela}
          idUnid={idUnid}
          ano={ano}
          enteLabel={ente}
          unidadeLabel={unidade}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_60%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-14">
        <header className="text-center lg:text-left">
          <h1 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">Análise de Fracionamentos</h1>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Combine município, jurisdicionado e ano para revelar agrupamentos suspeitos.
            Os filtros alimentam a análise detalhada com gráficos e séries temporais.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">Configuração</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Selecione o foco da auditoria</h2>
            <p className="mt-1 text-sm text-slate-300">
              Comece escolhendo o município; isso libera a seleção dos jurisdicionados do ente e organiza os filtros seguintes.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-200">Município</label>
                <select
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-sky-300 focus:bg-white/10 disabled:cursor-progress disabled:opacity-40"
                  value={ente}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEnte(value);
                    const configurado = value !== "";
                    setEnteConfigurado(configurado);
                    setUnidade("");
                    setIdUnid("");
                    setUnidadeConfigurada(false);
                  }}
                  disabled={carregandoUnidades}
                >
                  <option value="" style={optionStyle}>
                    {carregandoUnidades ? "Carregando municípios..." : "Selecione um município"}
                  </option>
                  {municipios.map((nome) => (
                    <option key={nome} value={nome} style={optionStyle}>
                      {nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">Jurisdicionado</label>
                <select
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-sky-300 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  value={unidade ? `${unidade}::${idUnid}` : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      setUnidade("");
                      setIdUnid("");
                      setUnidadeConfigurada(false);
                      return;
                    }
                    const [nomeUnidade, codigo] = value.split("::");
                    setUnidade(nomeUnidade);
                    setIdUnid(codigo || "");
                    setUnidadeConfigurada(true);
                  }}
                  disabled={!enteConfigurado || jurisdicionadosDisponiveis.length === 0}
                >
                  <option value="" style={optionStyle}>
                    {enteConfigurado ? "Selecione o jurisdicionado" : "Escolha um município primeiro"}
                  </option>
                  {jurisdicionadosDisponiveis.map(([nome, codigo]) => (
                    <option key={`${nome}-${codigo}`} value={`${nome}::${codigo}`} style={optionStyle}>
                      {nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">Ano</label>
                <select
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-sky-300 focus:bg-white/10"
                value={ano ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setAno(value);
                  setAnoConfigurado(value !== "");
                }}
              >
                  <option value="" style={optionStyle}>Selecione o ano</option>
                  <option value="2018" style={optionStyle}>2018</option>
                  <option value="2019" style={optionStyle}>2019</option>
                  <option value="2020" style={optionStyle}>2020</option>
                  <option value="2021" style={optionStyle}>2021</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!filtrosProntos}
              className={`mt-8 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200
                ${
                  filtrosProntos
                    ? "bg-sky-400 text-slate-950 hover:bg-sky-300"
                    : "bg-slate-700 text-slate-400 cursor-not-allowed"
                }`}
              onClick={(e) => {
                e.preventDefault();
                if (filtrosProntos) setAbrirTabela(true);
              }}
            >
              Consultar fracionamentos
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-sky-400/20 p-2 text-sky-200">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-300">Seleção atual</p>
                  <p className="text-sm text-white">
                    {enteConfigurado ? ente : "Município não definido"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Jurisdicionado:{" "}
                <span className="text-slate-200">
                  {unidadeConfigurada ? unidade : "aguardando seleção"}
                </span>
              </p>
              <p className="text-xs text-slate-400">
                Ano: <span className="text-slate-200">{anoConfigurado ? ano : "—"}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-semibold text-white">Fluxo da análise</h3>
              <ul className="mt-3 space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <Compass className="mt-0.5 h-4 w-4 text-emerald-300" />
                  Explore os grupos de empenhos suspeitos antes de abrir os empenhos.
                </li>
                <li className="flex items-start gap-2">
                  <Layers className="mt-0.5 h-4 w-4 text-sky-300" />
                  Ao entrar em um grupo, detalhes, gráficos e estatísticas ajudam a decidir o foco.
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
};
