import { Suggestion } from '../pages/consultaEmpenhos/types'

type AutocompleteInputProps = {
  label: string;
  value: string;
  setValue: (c: string) => void;
  handleChange: (val: string, type: number, key: string) => void;
  type: number;
  stateKey: string;
  suggestions: Suggestion[];
  setSuggestions: (s: Suggestion[]) => void;
  configured: boolean;
  setConfigured: (c: boolean) => void;
  placeholder: string;
  disabled: boolean;
  setIdUnid?: (s: string) => void;
};

const prefeituras = [
  "SAO JOAO DE MERITI",
  "PINHEIRAL",
  "TERESOPOLIS",
  "GUAPIMIRIM",
  "MARICA",
  "SAQUAREMA",
  "PIRAI",
  "MANGARATIBA",
  "ITABORAI",
  "QUISSAMA",
  "ITAPERUNA",
  "DUAS BARRAS",
  "PORCIUNCULA",
  "ANGRA DOS REIS",
  "BOM JESUS DO ITABAPOANA",
  "SAO SEBASTIAO DO ALTO",
  "BOM JARDIM",
  "PARACAMBI",
  "VARRE SAI",
  "QUATIS",
  "CARDOSO MOREIRA",
  "RIO DAS OSTRAS",
  "MACAE",
  "NITEROI",
  "CANTAGALO",
  "MENDES",
  "TRAJANO DE MORAIS",
  "BELFORD ROXO",
  "RIO CLARO",
  "MAGE",
  "ITAGUAI",
  "SAO FRANCISCO DO ITABAPOANA",
  "VALENCA",
  "CAMBUCI",
  "NATIVIDADE",
  "RIO BONITO",
  "RESENDE",
  "SAO GONCALO",
  "APERIBE",
  "PATY DO ALFERES",
  "VOLTA REDONDA",
  "QUEIMADOS",
  "ITATIAIA",
  "SEROPEDICA",
  "BARRA DO PIRAI",
  "NOVA IGUACU",
  "SAO FIDELIS",
  "CACHOEIRAS DE MACACU",
  "CABO FRIO",
  "MACUCO",
  "CAMPOS DOS GOYTACAZES",
  "CARMO",
  "SILVA JARDIM",
  "SANTO ANTONIO DE PADUA",
  "BARRA MANSA",
  "ARARUAMA",
  "SAO JOSE DE UBA",
  "RIO DAS FLORES",
  "COMENDADOR LEVY GASPARIAN",
  "CARAPEBUS",
  "CORDEIRO",
  "ITAOCARA",
  "ARMACAO DE BUZIOS",
  "ITALVA",
  "LAJE DO MURIAE",
  "JAPERI",
  "CONCEICAO DE MACABU",
  "MESQUITA",
  "AREAL",
  "ENGENHEIRO PAULO DE FRONTIN",
  "PARAIBA DO SUL",
  "VASSOURAS",
  "PARATY",
  "PETROPOLIS",
  "ARRAIAL DO CABO",
  "SAO JOSE DO VALE DO RIO PRETO",
  "SAO PEDRO DA ALDEIA",
  "NOVA FRIBURGO",
  "MIRACEMA",
  "TRES RIOS",
  "DUQUE DE CAXIAS",
  "PORTO REAL",
  "NILOPOLIS",
  "SUMIDOURO",
  "MIGUEL PEREIRA",
  "SAPUCAIA",
  "TANGUA",
  "IGUABA GRANDE",
  "SANTA MARIA MADALENA",
  "SAO JOAO DA BARRA",
  "CASIMIRO DE ABREU"
];

export function AutocompleteInput({
  label,
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
  disabled,
  setIdUnid,

}: AutocompleteInputProps) {
  return (
    <div className="mb-4">
      <label className="block mb-2">{label}:</label>
      <div className="relative">
        {!configured ? (
          label === "Prefeitura" ? (
            // --- Dropdown for Prefeitura ---
            <select
              value={value}
              onChange={(e) => {
                handleChange(e.target.value, type, stateKey)
                setConfigured(true);
              }}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Selecione uma prefeitura...</option>
              {[...prefeituras].sort().map((p, idx) => (
              <option key={idx} value={p}>
                {p}
              </option>
              ))}
            </select>
            ) : (
            // --- Original input for other cases ---
            <input
              type="text"
              disabled={label === "Jurisdicionado" && !disabled}
              value={value}
              onChange={(e) => handleChange(e.target.value, type, stateKey)}
              placeholder={placeholder}
              className="w-full p-2 border border-gray-300 rounded"
            />
          )
        ) : (
          <div className="w-full p-2 border border-gray-300 rounded flex items-center justify-between">
            <span>{value}</span>
            <button
              type="button"
              className="ml-2 text-gray-500 hover:text-red-600 font-bold"
              onClick={() => {
                setConfigured(false);
                handleChange("", type, stateKey); // limpa também
                setSuggestions([]);
              }}
              aria-label="Limpar campo"
            >
              ×
            </button>
          </div>
        )}

        {/* mantém as sugestões apenas para inputs, não para Prefeitura */}
        {label !== "Prefeitura" && suggestions.some((s) => s.score > 0.2) && (
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
                      if (label === "Jurisdicionado") {
                        setIdUnid?.(s.idunid ?? "");
                      }
                      setSuggestions([]);
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
