import { Dispatch, SetStateAction, useCallback, useRef, useState } from "react";

interface FiltrosEmpenhoProps {
  unidade: string;
  setUnidade: Dispatch<SetStateAction<string>>;
  elementoDespesa: string;
  setElementoDespesa: Dispatch<SetStateAction<string>>;
  credor: string;
  setCredor: Dispatch<SetStateAction<string>>;
}

export default function FiltrosEmpenho({
  unidade,
  setUnidade,
  elementoDespesa,
  setElementoDespesa,
  credor,
  setCredor,
}: FiltrosEmpenhoProps) {

  const [suggestionsUnidade, setSuggestionsUnidade] = useState<string | null>(null);
  const [suggestionsElemDespesa, setSuggestionsElemDespesa] = useState<string | null>(null);
  const [suggestionsCredor, setSuggestionsCredor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Separate timers for each field
  const timeouts = useRef<{ [key: string]: number | undefined }>({});

  const fetchAutoComplete = async (query: string, type: number) => {
    if (!query.trim()) {
      return [];
    }

    try {
      setLoading(true);
      const payload = { consulta: query, tipo: type };
      const response = await fetch("http://localhost:8000/api/auto-filling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (type === 0) {
        setSuggestionsUnidade(data);
      } else if (type === 1) {
        setSuggestionsElemDespesa(data);
      } else if (type === 2) {
        setSuggestionsCredor(data);
      }
    } catch (err) {
      console.error("Erro ao buscar sugestões:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string, type: number, key: string) => {
    // Update state
    if (key === "unidade") {
      setUnidade(value);
      setSuggestionsUnidade(""); // Clear or placeholder immediately
    }
    if (key === "elementoDespesa") {
      setElementoDespesa(value);
      setSuggestionsElemDespesa("");
    }
    if (key === "credor") {
      setCredor(value);
      setSuggestionsCredor("");
    }

    // Se o campo foi limpo, zera a sugestão e não busca nada
    if (!value.trim()) {
      if (key === "unidade") setSuggestionsUnidade("");
      if (key === "elementoDespesa") setSuggestionsElemDespesa("");
      if (key === "credor") setSuggestionsCredor("");
      return;
    }

    // Clear existing timer for this field
    if (timeouts.current[key]) {
      clearTimeout(timeouts.current[key]);
    }

    // Start a new timer
    timeouts.current[key] = window.setTimeout(() => {
      fetchAutoComplete(value, type);
    }, 300); 
  };

  return (
    <div>

      <label className="block mb-2">Unidade:</label>
      <input
        type="text"
        value={unidade}
        onChange={(e) => handleChange(e.target.value, 0, "unidade")}
        placeholder="Digite a unidade"
        className="w-full p-2 border border-gray-300 rounded"
      />
      <div className="text-gray-600 mb-4">Sugestão: {suggestionsUnidade}</div>
      
      <label className="block mb-2">Elemento da Despesa:</label>
      <input
        type="text"
        value={elementoDespesa}
        onChange={(e) => handleChange(e.target.value, 1, "elementoDespesa")}
        placeholder="Digite o elemento da despesa"
        className="w-full p-2 border border-gray-300 rounded"
      />
      <div className="text-gray-600 mb-4">Sugestão: {suggestionsElemDespesa}</div>
      

      <label className="block mb-2">Credor:</label>
      <input
        type="text"
        value={credor}
        onChange={(e) => handleChange(e.target.value, 2, "credor")}
        placeholder="Digite o credor"
        className="w-full p-2 border border-gray-300 rounded"
      />
      <div className="text-gray-600 mb-4">Sugestão: {suggestionsCredor}</div>
      
      {/* {loading && <p>Carregando sugestões...</p>}
      {!loading && suggestions.length > 0 && (
        <ul className="border border-gray-300 rounded p-2 mt-2 bg-white">
          {suggestions.map((s, idx) => (
            <li key={idx} className="cursor-pointer hover:bg-gray-100 p-1">
              {s}
            </li>
          ))}
        </ul>
      )} */}

    </div>
  );
}