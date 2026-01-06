import { useState } from 'react';
import { Suggestion } from '../pages/consultaEmpenhos/types'
import { useUnidades } from "../context/UnidadesContext";

type AutocompleteInputProps = {
  label: string;
  tooltip?: string;
  value: string;
  setValue: (c: string) => void;
  handleChange: (val: string, type: number, key: string) => void;
  type: number;
  stateKey: string;
  suggestions: Suggestion[] | null;
  setSuggestions: ((s: Suggestion[]) => void) | null;
  configured: boolean;
  setConfigured: (c: boolean) => void;
  placeholder: string;
  enteConfigurado: boolean;
  setIdUnid?: (s: string) => void;
  ente: string;
};

export function AutocompleteInput({
  label,
  tooltip,
  value,
  setValue,
  handleChange,
  type,
  stateKey,
  suggestions,
  setSuggestions,
  configured,
  setConfigured,
  placeholder,
  enteConfigurado,
  setIdUnid,
  ente

}: AutocompleteInputProps) {
  const { unidades, loading } = useUnidades();
  const optionStyle = { color: "#0f172a", backgroundColor: "#e2e8f0" };

  return (
    <div className="mb-4">
      <label className="block mb-2 text-sm font-medium text-slate-200" title={tooltip}>{label}:</label>
      <div className="relative">
        {!configured ? (
          (stateKey === "ente" || stateKey === "unidade") ? (
            <>
            {stateKey === "ente" && (
              <select
                value={value}
                disabled={loading}
                onChange={(e) => {
                  const ente = e.target.value;
                  handleChange(ente, -1, stateKey); // won't fetch anything
                  setConfigured(true);
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-sky-300 focus:bg-white/10 disabled:cursor-progress disabled:opacity-40"
              >
                <option value="" style={optionStyle}>
                  {loading ? "Carregando municípios..." : "Selecione um município..."}
                </option>
                {Object.keys(unidades).sort().map((ente, idx) => (
                  <option key={idx} value={ente} style={optionStyle}>
                    {ente}
                  </option>
                ))}
              </select>
            )}

            {stateKey === "unidade" && (
              <select
                value={value}
                disabled={!enteConfigurado} // só habilita se já escolheu um municipio
                onChange={(e) => {
                  const [unid, idunid] = e.target.value.split("::");
                  setValue(unid);
                  setIdUnid?.(idunid);
                  handleChange(unid, -1, stateKey);
                  setConfigured(true);
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-sky-300 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <option value="" style={optionStyle}>Selecione um jurisdicionado...</option>
                {unidades[ente]
                  ?.slice()
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([unid, idunid]: [string, string], idx: number) => (
                    <option key={idx} value={`${unid}::${idunid}`} style={optionStyle}>
                      {unid}
                    </option>
                  ))}
              </select>
            )}
          </>
            
          ) : (
            // --- Original input for other cases ---
            <input
              type="text"
              disabled={stateKey === "unidade" && !enteConfigurado}
              value={value}
              onChange={(e) => handleChange(e.target.value, type, stateKey)}
              placeholder={placeholder}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition focus:border-sky-300 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            />
          )
        ) : (
          <div className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white flex items-center justify-between">
            <span className="text-slate-100">{value}</span>
            <button
              type="button"
              className="ml-2 text-slate-400 hover:text-red-400 font-bold"
              onClick={() => {
                setConfigured(false);
                handleChange("", type, stateKey); // limpa também
                setSuggestions?.([]);
              }}
              aria-label="Limpar campo"
            >
              ×
            </button>
          </div>
        )}

        {/* mantém as sugestões apenas para inputs, não para Município e Jurisdicionado*/}
        {(stateKey !== "ente" && stateKey !== "unidade" && suggestions) && suggestions.some((s) => s.score > 0.2) && (
          <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 shadow-lg">
            {suggestions
              .slice(0, 5)
              .filter((s) => s.score > 0.2)
              .map((s, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    className="block w-full text-left px-3 py-2 hover:bg-blue-100"
                    onClick={() => {
                      setValue(s.best_match);
                      if (setSuggestions) setSuggestions([]);
                      setConfigured(true);
                    }}
                  >
                    {s.best_match}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
