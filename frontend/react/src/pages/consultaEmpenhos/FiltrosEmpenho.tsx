import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Suggestion } from './types'
import { AutocompleteInput } from "./AutoCompleteInputComponent";

interface FiltrosEmpenhoProps {
  unidade: string;
  setUnidade: Dispatch<SetStateAction<string>>;
  elementoDespesa: string;
  setElementoDespesa: Dispatch<SetStateAction<string>>;
  credor: string;
  setCredor: Dispatch<SetStateAction<string>>;
  unidadeConfigurada: boolean;
  setUnidadeConfigurada: Dispatch<SetStateAction<boolean>>;
  elemDepesaConfigurado: boolean;
  setElemDepesaConfigurado: Dispatch<SetStateAction<boolean>>;
  credorConfigurado: boolean;
  setCredorConfigurado: Dispatch<SetStateAction<boolean>>;
}


export default function FiltrosEmpenho({
  unidade,
  setUnidade,
  elementoDespesa,
  setElementoDespesa,
  credor,
  setCredor,
  unidadeConfigurada,
  setUnidadeConfigurada,
  elemDepesaConfigurado,
  setElemDepesaConfigurado,
  credorConfigurado,
  setCredorConfigurado,

}: FiltrosEmpenhoProps) {

  const [suggestionsUnidade, setSuggestionsUnidade] = useState<Suggestion[]>([])
  const [suggestionsElemDespesa, setSuggestionsElemDespesa] = useState<Suggestion[]>([])
  const [suggestionsCredor, setSuggestionsCredor] = useState<Suggestion[]>([])


  // Separate timers for each field
  const timeouts = useRef<{ [key: string]: number | undefined }>({});


  // TODO: colocar isso em outro arquivo .ts
  const fetchAutoComplete = async (query: string, type: number) => {
    if (!query.trim()) {
      return [];
    }

    try {
      //setLoading(true);
      const payload = { consulta: query, tipo: type };
      const response = await fetch("http://localhost:8000/api/auto-filling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      // const firstElement = data[0].best_match;
      
      if (type === 0) {
        setSuggestionsUnidade(Array.isArray(data) ? data : []);
      } else if (type === 1) {
        setSuggestionsElemDespesa(Array.isArray(data) ? data : []);
      } else if (type === 2) {
        setSuggestionsCredor(Array.isArray(data) ? data : []);
      }
      
    } catch (err) {
      console.error("Erro ao buscar sugestões:", err);
    } 
  };

  const handleChange = (value: string, type: number, key: string) => {
    // Update state
    if (key === "unidade") {
      setUnidade(value);
      setSuggestionsUnidade([]); // Clear or placeholder immediately
    }
    if (key === "elementoDespesa") {
      setElementoDespesa(value);
      setSuggestionsElemDespesa([]);
    }
    if (key === "credor") {
      setCredor(value);
      setSuggestionsCredor([]);
    }

    // Se o campo foi limpo, zera a sugestão e não busca nada
    if (!value.trim()) {
      if (key === "unidade") setSuggestionsUnidade([]);
      if (key === "elementoDespesa") setSuggestionsElemDespesa([]);
      if (key === "credor") setSuggestionsCredor([]);
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

      <AutocompleteInput
        label="Unidade"
        value={unidade}
        setValue={setUnidade}
        handleChange={handleChange}
        type={0}
        stateKey="unidade"
        suggestions={suggestionsUnidade}
        setSuggestions={setSuggestionsUnidade}
        configured={unidadeConfigurada}
        setConfigured={setUnidadeConfigurada}
        placeholder="Digite a unidade"
      />

      <AutocompleteInput
        label="Elemento da Despesa"
        value={elementoDespesa}
        setValue={setElementoDespesa}
        handleChange={handleChange}
        type={1}
        stateKey="elementodespesa"
        suggestions={suggestionsElemDespesa}
        setSuggestions={setSuggestionsElemDespesa}
        configured={elemDepesaConfigurado}
        setConfigured={setElemDepesaConfigurado}
        placeholder="Digite o elemento da despesa"
      />

      <AutocompleteInput
        label="Credor"
        value={credor}
        setValue={setCredor}
        handleChange={handleChange}
        type={2}
        stateKey="credor"
        suggestions={suggestionsCredor}
        setSuggestions={setSuggestionsCredor}
        configured={credorConfigurado}
        setConfigured={setCredorConfigurado}
        placeholder="Digite o credor"
      />
      
    </div>
  );
}