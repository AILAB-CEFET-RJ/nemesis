import { Dispatch, SetStateAction} from "react";
import { Suggestion } from '../consultaEmpenhos/types'
import { Empenho3DItem } from "./types";

interface ModalCanvasProps {
  handleChange: (value: string) => void;
  handleClick: (value: string) => void;
  ente: string;
  unidade: string;
  setabrir3d: Dispatch<SetStateAction<boolean>>;
  selectedElem: Empenho3DItem | null;
  setSelectedElem: Dispatch<SetStateAction<Empenho3DItem | null>>;
  selectedAbrirMais: boolean;
  setSelectedAbrirMais: Dispatch<SetStateAction<boolean>>;
  data: Empenho3DItem[];
  consultaElem: string;
  suggestionsElemDespesa: Suggestion[];
  selectedEmpenho: Empenho3DItem | null;
  setSelectedEmpenho: Dispatch<SetStateAction<Empenho3DItem | null>>;
}

export function ModalCanvas3D({ 
    handleChange,
    handleClick,
    ente, 
    unidade, 
    setabrir3d, 
    selectedElem, 
    setSelectedElem,
    selectedAbrirMais, 
    setSelectedAbrirMais,
    data, 
    consultaElem,
    suggestionsElemDespesa,
    selectedEmpenho,
    setSelectedEmpenho,
 }: ModalCanvasProps) {


    return (
        <div className="w-[320px] bg-[#f8f9fa] p-4 border-r border-[#ccc] overflow-y-auto shrink-0">
        <div className="p-3 bg-white rounded border border-gray-300 mb-4">
          <div className="mb-3">
            <strong>Campos selecionados:</strong>  <br></br>
            Município: {ente} <br></br>
            Jurisdicionado: {unidade}
          </div>
          <button 
            className="w-[80%] py-1.5 rounded transition bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setabrir3d(false)}>
            Refazer Seleção
          </button>
        </div>

        <div className="my-6 h-px w-full bg-gray-200" />


        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <span>🧭</span> Projeção 3D de Elementos
        </h2>
        {selectedEmpenho && selectedAbrirMais && selectedEmpenho &&(
          <>
          <div>
            {/* <p><strong>ID:</strong> {selectedElem.id}</p> */}
              <p className="mt-4"><strong>Elemento da Despesa:</strong> {selectedElem?.elemdespesatce}</p>
              <p className="mt-4"><strong>ID empenho: </strong> {selectedEmpenho.id}</p>
              <p className="mt-4"><strong>Histórico: </strong> {selectedEmpenho.descricao}</p>
              <p className="mt-4"><strong>Credor: </strong> {selectedEmpenho.credor}</p>
              <p className="mt-4"><strong>Data: </strong> 
                {selectedEmpenho.dt_empenho 
                  ? new Date(selectedEmpenho.dt_empenho).toLocaleDateString("pt-BR")
                  : ""
                }
              </p>
              <p className="mt-4"><strong>Valor: </strong> 
                {Number(selectedEmpenho.vlr_empenho).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
          </div>
          <div className="grid grid-cols-1">
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold" 
                onClick={() => {
                setSelectedElem(null);
                setSelectedEmpenho(null);
                setSelectedAbrirMais(false);
                }
              }
                >Fechar
              </button>
            </div>
            </>
        )}
        {selectedElem && selectedAbrirMais && !selectedEmpenho &&(
          <>
          <div>
            <p className="mt-4"><strong>Elemento da Despesa:</strong> {selectedElem?.elemdespesatce}</p>
            <p className="mt-4"><strong>Número de empenhos:</strong> {data.length}</p>
            <p className="mt-4"><strong>Variação nas coordenadas X, Y e Z:</strong></p>
            <ul>
              <li><strong>X:</strong> {selectedElem?.var_x.toFixed(2)}</li>
              <li><strong>Y:</strong> {selectedElem?.var_y.toFixed(2)}</li>
              <li><strong>Z:</strong> {selectedElem?.var_z.toFixed(2)}</li>
            </ul>
          </div>
          <div className="grid grid-cols-1">
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold" 
              onClick={() => {
              setSelectedElem(null);
              setSelectedEmpenho(null);
              setSelectedAbrirMais(false);
              }
            }
              >Fechar
          </button>
          </div>
          
          </>
        )}
        {selectedElem && !selectedAbrirMais && !selectedEmpenho &&(
          <>  
          <p className="mt-4"><strong>Elemento da Despesa:</strong> {selectedElem?.elemdespesatce}</p>
          <div className="grid grid-cols-1">
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold"
              onClick={() => setSelectedAbrirMais(true)}
            >
              Abrir detalhes
            </button>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold" 
                  onClick={() => {
                  setSelectedElem(null);
                  setSelectedEmpenho(null);
                  setSelectedAbrirMais(false);
                  }
                }
                  >Fechar
            </button>
          </div>
          </>
        )}
        {!selectedElem && !selectedAbrirMais && !selectedEmpenho &&(
          <div>
            <p className="mt-2 text-sm text-gray-600">
              Selecione um dos <span className="font-medium text-blue-600">{data.length} pontos</span> ou realize a busca abaixo.
            </p>
            <div className="mt-4 relative">
              <textarea
                value={consultaElem}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Digite o Elemento da Despesa"
                rows={4}
                className="w-full rounded-xl border border-gray-300 pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute left-3 top-2 text-gray-400">🔍</span>
            </div>
            <div>
              {suggestionsElemDespesa.some((s) => s.score > 0.2) && (
                <ul>
                  {suggestionsElemDespesa
                    .filter((s) => s.score > 0.2)
                    .map((s, idx) => (
                      <li key={idx} className="mb-1">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-1 rounded-md bg-white bg-opacity-80 hover:bg-blue-100"
                          onClick={() => {handleClick(s.best_match)}}
                        >
                          {s.best_match}
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>

          </div>
        )}
      </div>
    );
}