import React, { useMemo, useState } from "react";
import Empenho3DCanvas from "./Empenho3DCanvas";
import { useUnidades } from "../../context/UnidadesContext";
import { Compass, Layers, PlayCircle, RefreshCw } from "lucide-react";

export const Visualizacao3DPage: React.FC = () => {
  const [ente, setEnte] = useState<string>("");
  const [unidade, setUnidade] = useState<string>("");
  const [idUnid, setIdUnid] = useState<string>("");
  const [abrir3d, setAbrir3d] = useState(false);

  const { unidades, loading } = useUnidades();
  const municipios = useMemo(() => Object.keys(unidades || {}).sort(), [unidades]);
  const jurisdicionados = useMemo(() => {
    if (!ente || !unidades[ente]) return [];
    return [...unidades[ente]].sort((a, b) => a[0].localeCompare(b[0]));
  }, [ente, unidades]);

  const filtrosProntos = Boolean(ente && unidade && idUnid);

  if (abrir3d) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/60 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-sky-200">visualização 3d</p>
            <h1 className="text-2xl font-semibold text-white">
              {ente} · {unidade}
            </h1>
            <p className="text-sm text-slate-300">Explorando clusters com embeddings reduzidos.</p>
          </div>
          <button
            onClick={() => {
              setAbrir3d(false);
              setUnidade("");
              setIdUnid("");
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
          >
            <RefreshCw className="h-4 w-4" />
            Escolher outro foco
          </button>
        </div>
        <Empenho3DCanvas ente={ente} unidade={unidade} setabrir3d={setAbrir3d} />
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
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-300">
            exploração visual
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">
            Projeção 3D de Empenhos
          </h1>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Combine município e jurisdicionado para gerar o mapa tridimensional de empenhos,
            destacando agrupamentos suspeitos por similaridade semântica.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">Parâmetros</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Defina o recorte espacial</h2>
            <p className="mt-1 text-sm text-slate-300">
              Os dados carregam automaticamente dos cadastros existentes no banco.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-200">Município</label>
                <select
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-sky-300 focus:bg-white/10 disabled:cursor-progress disabled:opacity-40"
                  value={ente}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setEnte(valor);
                    setUnidade("");
                    setIdUnid("");
                  }}
                  disabled={loading}
                >
                  <option value="">
                    {loading ? "Carregando municípios..." : "Selecione um município"}
                  </option>
                  {municipios.map((nome) => (
                    <option key={nome} value={nome}>
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
                    const valor = e.target.value;
                    if (!valor) {
                      setUnidade("");
                      setIdUnid("");
                      return;
                    }
                    const [nome, codigo] = valor.split("::");
                    setUnidade(nome);
                    setIdUnid(codigo || "");
                  }}
                  disabled={!ente || jurisdicionados.length === 0}
                >
                  <option value="">
                    {ente ? "Selecione o jurisdicionado" : "Escolha um município primeiro"}
                  </option>
                  {jurisdicionados.map(([nome, codigo]) => (
                    <option key={`${nome}-${codigo}`} value={`${nome}::${codigo}`}>
                      {nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              disabled={!filtrosProntos}
              className={`mt-8 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
                filtrosProntos
                  ? "bg-sky-400 text-slate-950 hover:bg-sky-300"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
              onClick={() => setAbrir3d(true)}
            >
              Iniciar projeção
              <PlayCircle className="h-4 w-4" />
            </button>
          </div>

          <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-sky-400/20 p-2 text-sky-200">
                  <Layers className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-300">Jurisdicionado</p>
                  <p className="text-sm text-white">
                    {unidade ? unidade : "Aguardando seleção"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Município: <span className="text-slate-200">{ente || "—"}</span>
              </p>
              <p className="text-xs text-slate-400">
                Código interno: <span className="text-slate-200">{idUnid || "—"}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-semibold text-white">Por que visualizar em 3D?</h3>
              <ul className="mt-3 space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <Compass className="mt-0.5 h-4 w-4 text-emerald-300" />
                  Identifique clusters incomuns de elementos da despesa.
                </li>
                <li className="flex items-start gap-2">
                  <Layers className="mt-0.5 h-4 w-4 text-sky-300" />
                  Compare rapidamente valores e datas através do hover.
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
};
