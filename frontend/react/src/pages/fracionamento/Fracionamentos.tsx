import React, { useState, useRef, useEffect } from "react";
import { AutocompleteInput } from "../../components/AutoCompleteInputComponent";
import { TabelaComponent } from "../../components/TabelaComponent";


export const Fracionamentos: React.FC = () => {
    const [ente, setEnte] = useState<string>("");
    const [unidade, setUnidade] = useState<string>("");
    const [ano, setAno] = useState<string>("");
    const [idUnid, setIdUnid] = useState<string>("");
    const [enteConfigurado, setEnteConfigurado] = useState(false);
    const [unidadeConfigurada, setUnidadeConfigurada] = useState(false);
    const [anoConfigurado, setAnoConfigurado] = useState(false);
    const [abrirTabela, setAbrirTabela] = useState(false);

        

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
        return;
        }

    
    };

    return (
        <div>
            {!abrirTabela && (
                <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 font-sans p-6 pt-24">
                    <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
                        <h1 className="text-3xl font-bold mb-4">Fracionamentos</h1>
                        <p className="text-gray-600 mt-3 mb-5">
                        Escolha o Município, o Jurisdicionado e Ano para refinar sua busca:
                        </p>
                        <div className="text-left">
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
                                type={-1}
                                stateKey="unidade"
                                suggestions={null}
                                setSuggestions={null}
                                configured={unidadeConfigurada}
                                setConfigured={setUnidadeConfigurada}
                                placeholder="Digite o jurisdicionado"
                                enteConfigurado={enteConfigurado}
                                setIdUnid={setIdUnid}
                                ente={ente}
                            />
                            <div>
                                Ano:
                                <select
                                    className="mt-2 mb-6 w-full p-2 border rounded"
                                    value={ano ?? ""}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setAno(value);
                                        setAnoConfigurado(value !== "");
                                    }}
                                >
                                    <option value="">Selecione o ano</option>
                                    <option value="2018">2018</option>
                                    <option value="2019">2019</option>
                                    <option value="2020">2020</option>
                                    <option value="2021">2021</option>
                                </select>
                            </div>

                        </div>
        
                        <button
                        type="submit"
                        disabled={!(enteConfigurado && unidadeConfigurada && anoConfigurado)}
                        className={`w-full py-3 rounded transition
                            ${enteConfigurado && unidadeConfigurada && anoConfigurado
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
                    <TabelaComponent setAbrirTabela={setAbrirTabela} idUnid={idUnid} ano={ano}/>
                </div>   
            )}
            </div>
    );
};
