import React, { useState, useRef } from "react";
import Empenho3DCanvas from "./Empenho3DCanvas";
import { AutocompleteInput } from "../../components/AutoCompleteInputComponent";
import { Suggestion } from '../consultaEmpenhos/types'
import { fetchAutoComplete } from '../../utils/dataFetcher'

export const Visualizacao3DPage: React.FC = () => {
  const [ente, setEnte] = useState<string>("");
  const [unidade, setUnidade] = useState<string>("");
  const [enteConfigurado, setEnteConfigurado] = useState(false);
  const [unidadeConfigurada, setUnidadeConfigurada] = useState(false);
  const [abrir3d, setabrir3d] = useState(false);

  const handleChange = (value: string, type: number, key: string) => {
    // Update state
    if (key === "ente") {
      setEnte(value);
    }
    if (key === "unidade") {
      setUnidade(value);
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
    }
  return;
  };


  return (
    <div>
      {(!abrir3d) && (
        <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 font-sans p-6 pt-24">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
            <h1 className="text-3xl font-bold mb-4">Projetor de Empenhos em 3D</h1>
              <p className="text-gray-600 mt-3 mb-5">
                Escolha a Prefeitura e o Jurisdicionado para refinar sua busca:
              </p>
              <div className="text-left">
                <AutocompleteInput
                  label="Prefeitura"
                  value={ente}
                  setValue={setEnte}
                  handleChange={handleChange}
                  type={-1}
                  stateKey="ente"
                  suggestions={null}
                  setSuggestions={null}
                  configured={enteConfigurado}
                  setConfigured={setEnteConfigurado}
                  placeholder="Digite a prefeitura"
                  enteConfigurado={false}
                  ente={""}
                />
          
                <AutocompleteInput
                  label="Jurisdicionado"
                  value={unidade}
                  setValue={setUnidade}
                  handleChange={handleChange}
                  type={-1}
                  stateKey="unidade"
                  suggestions={null}
                  setSuggestions={null}
                  configured={unidadeConfigurada}
                  setConfigured={setUnidadeConfigurada}
                  placeholder="Digite o jurisdicionado"
                  enteConfigurado={enteConfigurado}
                  ente={ente}
                />
              </div>

              <button
                type="submit"
                disabled={!(enteConfigurado && unidadeConfigurada)}
                className={`w-full py-3 rounded transition
                  ${enteConfigurado && unidadeConfigurada
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                  }`}
                onClick={(e) => {
                  e.preventDefault();
                  setabrir3d(true);
                }}
              >
                Consultar
              </button>
              
          </div>
        </div>
      )}
      {abrir3d && (
        <div>
          <Empenho3DCanvas ente={ente} unidade={unidade} setabrir3d={setabrir3d}/>
        </div>
      )}


    </div>
  );
};
