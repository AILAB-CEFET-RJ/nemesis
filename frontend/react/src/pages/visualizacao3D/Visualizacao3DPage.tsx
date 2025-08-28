import React, { useState, useRef } from "react";
import Empenho3DCanvas from "./Empenho3DCanvas";
import { AutocompleteInput } from "../../components/AutoCompleteInputComponent";
import { Suggestion } from '../consultaEmpenhos/types'

export const Visualizacao3DPage: React.FC = () => {
  const [ente, setEnte] = useState<string>("");
  const [unidade, setUnidade] = useState<string>("");
  const [enteConfigurado, setEnteConfigurado] = useState(false);
  const [unidadeConfigurada, setUnidadeConfigurada] = useState(false);
  const [suggestionsEnte, setSuggestionsEnte] = useState<Suggestion[]>([])
  const [suggestionsUnidade, setSuggestionsUnidade] = useState<Suggestion[]>([])
  const [tentativa, setTentativa] = useState(false);
  const timeouts = useRef<{ [key: string]: number | undefined }>({});

  const fetchAutoComplete = async (query: string, type: number) => {
    if (!query.trim()) {
      return [];
    }

    try {
      //setLoading(true);
      const payload = { consulta: query, tipo: type, city: ente};
      const response = await fetch("http://localhost:8000/api/auto-filling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      // const firstElement = data[0].best_match;
      
      if (type === 0) {
        setSuggestionsEnte(Array.isArray(data) ? data : []);
      } else if (type === 1) {
        setSuggestionsUnidade(Array.isArray(data) ? data : []);
      }
      
    } catch (err) {
      console.error("Erro ao buscar sugestões:", err);
    } 
  };


  const handleChange = (value: string, type: number, key: string) => {
    // Update state
    if (key === "ente") {
      setEnte(value);
      setSuggestionsEnte([]); // Clear or placeholder immediately
    }
    if (key === "unidade") {
      setUnidade(value);
      setSuggestionsUnidade([]);
    }


    // Se o campo foi limpo, zera a sugestão e não busca nada
    if (!value.trim()) {
      if (key === "ente") {
        setSuggestionsEnte([]);
        setUnidade("")
        setUnidadeConfigurada(false);
        setSuggestionsUnidade([]);
      };
      if (key === "unidade") setSuggestionsUnidade([]);
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
      {(!tentativa) && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-sans p-6">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
            <h1 className="text-3xl font-bold mb-4">Projetor de Empenhos em 3D</h1>
              <p className="text-gray-600 mt-8 mb-5">
                Escolha o Ente e a Unidade para refinar sua busca:
              </p>

              <AutocompleteInput
                label="Ente"
                value={ente}
                setValue={setEnte}
                handleChange={handleChange}
                type={0}
                stateKey="ente"
                suggestions={suggestionsEnte}
                setSuggestions={setSuggestionsEnte}
                configured={enteConfigurado}
                setConfigured={setEnteConfigurado}
                placeholder="Digite o ente"
                disabled={false}
              />
        
              <AutocompleteInput
                label="Unidade"
                value={unidade}
                setValue={setUnidade}
                handleChange={handleChange}
                type={1}
                stateKey="unidade"
                suggestions={suggestionsUnidade}
                setSuggestions={setSuggestionsUnidade}
                configured={unidadeConfigurada}
                setConfigured={setUnidadeConfigurada}
                placeholder="Digite a unidade"
                disabled={enteConfigurado}
              />

              <button
                type="submit"
                disabled={!(enteConfigurado || unidadeConfigurada)}
                className={`w-full py-3 rounded transition
                  ${enteConfigurado || unidadeConfigurada
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                  }`}
                onClick={(e) => {
                  e.preventDefault();
                  setTentativa(true);
                }}
              >
                Consultar
              </button>
              
          </div>
        </div>
      )}
      {tentativa && (
        <div>
          <Empenho3DCanvas ente={ente} unidade={unidade}/>
        </div>
      )}


    </div>
  );
};
