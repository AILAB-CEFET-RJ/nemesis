import { Dispatch, SetStateAction, useRef, useState } from "react";
import { Suggestion } from './types'
import { AutocompleteInput } from "../../components/AutoCompleteInputComponent";
import { fetchAutoComplete } from "../../utils/dataFetcher";

interface FiltrosEmpenhoProps {
  ente:string;
  setEnte: Dispatch<SetStateAction<string>>;
  unidade: string;
  setUnidade: Dispatch<SetStateAction<string>>;
  elementoDespesa: string;
  setElementoDespesa: Dispatch<SetStateAction<string>>;
  credor: string;
  setCredor: Dispatch<SetStateAction<string>>;
  enteConfigurado: boolean
  setEnteConfigurado:Dispatch<SetStateAction<boolean>>;
  unidadeConfigurada: boolean;
  setUnidadeConfigurada: Dispatch<SetStateAction<boolean>>;
  elemDespesaConfigurado: boolean;
  setElemDespesaConfigurado: Dispatch<SetStateAction<boolean>>;
  credorConfigurado: boolean;
  setCredorConfigurado: Dispatch<SetStateAction<boolean>>;
}


export default function FiltrosEmpenho({
  ente,
  setEnte,
  unidade,
  setUnidade,
  elementoDespesa,
  setElementoDespesa,
  credor,
  setCredor,
  enteConfigurado,
  setEnteConfigurado,
  unidadeConfigurada,
  setUnidadeConfigurada,
  elemDespesaConfigurado,
  setElemDespesaConfigurado,
  credorConfigurado,
  setCredorConfigurado,

}: FiltrosEmpenhoProps) {

  const [suggestionsElemDespesa, setSuggestionsElemDespesa] = useState<Suggestion[]>([])
  const [suggestionsCredor, setSuggestionsCredor] = useState<Suggestion[]>([])
  const timeouts = useRef<{ [key: string]: number | undefined }>({});


  const handleChange = (value: string, type: number, key: string) => {
    // Update state
    if (key === "ente") {
      setEnte(value);

    }
    if (key === "unidade") {
      setUnidade(value);
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
      if (key === "ente") {
        setUnidade("");
        setEnte("");
        setUnidadeConfigurada(false);
        setEnteConfigurado(false);
      };
      if (key === "unidade"){
        setUnidade("");
        setUnidadeConfigurada(false);
      } 
      if (key === "elementoDespesa") setSuggestionsElemDespesa([]);
      if (key === "credor") setSuggestionsCredor([]);
      return;
    }

    // Clear existing timer for this field
    if (timeouts.current[key]) {
      clearTimeout(timeouts.current[key]);
    }

    // Set suggestions for elemdespesatce and credor
    if(key === "elementoDespesa" || key === "credor"){
      timeouts.current[key] = window.setTimeout(async () => {
        const results = await fetchAutoComplete(value, type, "");

        if (type === 2) {
          setSuggestionsElemDespesa(Array.isArray(results) ? results : []);
        } else if (type == 3){
          setSuggestionsCredor(Array.isArray(results) ? results : []);
        }
      }, 300);
    }
  };

  return (
    <div>

      <AutocompleteInput
        label="Municipio"
        value={ente}
        setValue={setEnte}
        handleChange={handleChange}
        type={-1}
        stateKey="ente"
        suggestions={null}
        setSuggestions={null}
        configured={enteConfigurado}
        setConfigured={setEnteConfigurado}
        placeholder="Digite o município"
        enteConfigurado={false}
        ente={""}
      />

      <AutocompleteInput
        label="Jurisdicionado"
        value={unidade}
        setValue={setUnidade}
        handleChange={handleChange}
        type={1}
        stateKey="unidade"
        suggestions={null}
        setSuggestions={null}
        configured={unidadeConfigurada}
        setConfigured={setUnidadeConfigurada}
        placeholder="Digite o Jurisdicionado"
        enteConfigurado={enteConfigurado}
        ente={ente}
      />

      <AutocompleteInput
        label="Elemento da Despesa"
        value={elementoDespesa}
        setValue={setElementoDespesa}
        handleChange={handleChange}
        type={2}
        stateKey="elementoDespesa"
        suggestions={suggestionsElemDespesa}
        setSuggestions={setSuggestionsElemDespesa}
        configured={elemDespesaConfigurado}
        setConfigured={setElemDespesaConfigurado}
        placeholder="Digite o elemento da despesa"
        enteConfigurado={false}
        ente={""}
      />

      <AutocompleteInput
        label="Credor"
        value={credor}
        setValue={setCredor}
        handleChange={handleChange}
        type={3}
        stateKey="credor"
        suggestions={suggestionsCredor}
        setSuggestions={setSuggestionsCredor}
        configured={credorConfigurado}
        setConfigured={setCredorConfigurado}
        placeholder="Digite o credor"
        enteConfigurado={false}
        ente={""}
      />
      
    </div>
  );
}