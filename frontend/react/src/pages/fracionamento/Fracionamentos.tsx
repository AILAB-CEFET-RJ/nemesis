import React, { useState, useRef, useEffect } from "react";
import { Suggestion } from '../consultaEmpenhos/types'
import { AutocompleteInput } from "../../components/AutoCompleteInputComponent";
import { fetchAutoComplete } from '../../utils/dataFetcher'
import { TabelaComponent } from "../../components/TabelaComponent";


export const Fracionamentos: React.FC = () => {
    const [ente, setEnte] = useState<string>("");
    const [unidade, setUnidade] = useState<string>("");
    const [idUnid, setIdUnid] = useState<string>("");
    const [enteConfigurado, setEnteConfigurado] = useState(false);
    const [unidadeConfigurada, setUnidadeConfigurada] = useState(false);
    const [suggestionsEnte, setSuggestionsEnte] = useState<Suggestion[]>([])
    const [suggestionsUnidade, setSuggestionsUnidade] = useState<Suggestion[]>([])
    const [abrirTabela, setAbrirTabela] = useState(false);
    const timeouts = useRef<{ [key: string]: number | undefined }>({});

        

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

        if (timeouts.current[key]) {
            clearTimeout(timeouts.current[key]);
        }

        // Start a new debounce timer
        timeouts.current[key] = window.setTimeout(async () => {
            const results = await fetchAutoComplete(value, type, ente, "");

            if (type === 0) {
                setSuggestionsEnte(Array.isArray(results) ? results : []);
            } else if (type === 1 && Array.isArray(results)) {
                setSuggestionsUnidade(results); // salva objeto
            } else {
                setSuggestionsUnidade([]);
            }
        }, 300);
        };

    return (
        <div>
            {!abrirTabela && (
                <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 font-sans p-6 pt-24">
                    <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
                        <h1 className="text-3xl font-bold mb-4">Tabela de Fracionamentos de Empenhos</h1>
                        <p className="text-gray-600 mt-3 mb-5">
                        Escolha o Ente e a Unidade para refinar sua busca:
                        </p>
                        <div className="text-left">
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
                                setIdUnid={setIdUnid}
                            />
                        </div>
        
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
                            setAbrirTabela(true); 
                        }}
                        >
                        Consultar
                        </button>
                        
                    </div>
                </div>
            )}
            {abrirTabela && (
                <div> 
                    <TabelaComponent setAbrirTabela={setAbrirTabela} idUnid={idUnid} />
                </div>   
            )}
            </div>
    );
};
