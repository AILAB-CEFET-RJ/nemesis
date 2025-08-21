import React, { useState, useEffect } from "react";
import CardItem from './CardItem'
import SelectPageBar from './SelectPageBar'
import FiltrosEmpenho  from "./FiltrosEmpenho";
import { EmpenhoItem } from "./types";



export const ConsultasEmpenhos: React.FC = () => {
  const [unidade, setUnidade] = useState("");
  const [elementoDespesa, setElementoDespesa] = useState("");
  const [credor, setCredor] = useState("");
  const [historico, setHistorico] = useState("");
  const [respostaAPI, setRespostaAPI] = useState<EmpenhoItem[] | null>(null);
  const [loading, setLoading] = useState(false); 
  const [tentativa, setTentativa] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showNotSuccess, setShowNotSuccess] = useState(false);
  const [unidadeConfigurada, setUnidadeConfigurada] = useState(false);
  const [elemDepesaConfigurado, setElemDepesaConfigurado] = useState(false);
  const [credorConfigurado, setCredorConfigurado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { unidade, elementoDespesa, credor, historico };
    setLoading(true);
    setRespostaAPI(null);

    try {
      const response = await fetch("http://localhost:8000/api/consulta_vs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Resposta do backend:", data);
      setRespostaAPI(data);
    } catch (error) {
      console.error("Erro ao enviar:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (respostaAPI && respostaAPI.length > 0) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000); 

      return () => clearTimeout(timer);
    }
    if (respostaAPI && respostaAPI.length == 0){
      setShowNotSuccess(true);
      const timer = setTimeout(() => {
        setShowNotSuccess(false);
      }, 3000); 

      return () => clearTimeout(timer);
    }

  }, [respostaAPI]);


  useEffect(() => {
    if (tentativa) {
      setTentativa(true);
      const timer = setTimeout(() => {
        setTentativa(false);
      }, 3000); 

      return () => clearTimeout(timer);
    }
  }, [tentativa]);

  return (
    <div className="flex flex-col items-center min-h-screen p-8 bg-gray-100 font-sans">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md mb-6"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          Consulta de Empenhos
        </h1>

        <FiltrosEmpenho
          unidade={unidade}
          setUnidade={setUnidade}
          elementoDespesa={elementoDespesa}
          setElementoDespesa={setElementoDespesa}
          credor={credor}
          setCredor={setCredor}
          unidadeConfigurada={unidadeConfigurada}
          setUnidadeConfigurada={setUnidadeConfigurada}
          elemDepesaConfigurado={elemDepesaConfigurado}
          setElemDepesaConfigurado={setElemDepesaConfigurado}
          credorConfigurado={credorConfigurado}
          setCredorConfigurado={setCredorConfigurado}
        />

        <label className="block mb-2">Histórico:</label>
        <textarea
          value={historico}
          onChange={(e) => setHistorico(e.target.value)}
          placeholder="Digite o histórico"
          rows={4}
          className="w-full p-2 mb-6 border border-gray-300 rounded"
        />


        <button
          type="submit"
          disabled={!(unidadeConfigurada || elemDepesaConfigurado || credorConfigurado)}
          className={`w-full py-3 rounded transition
            ${unidadeConfigurada || elemDepesaConfigurado || credorConfigurado
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          onClick={(e) => {
            if (!(unidadeConfigurada || elemDepesaConfigurado || credorConfigurado)) {
              e.preventDefault();
              setTentativa(true);
            }
          }}
        >
          Consultar
        </button>
        
      </form>

      <div className="w-full max-w-3xl">
        {tentativa && (
          <div className="bg-white border border-blue-700 rounded-md mt-3 p-4 inline-block">
            <div>Todos os campos devem ser preenchidos <span>⚠</span></div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-600 border-opacity-50"></div>
            <span className="ml-3 text-gray-600">Carregando...</span>
          </div>
        )}

        {!loading && respostaAPI && (
          <div>
            {showSuccess && (
              <div className="bg-white border border-blue-700 rounded-md mb-5 p-4 inline-block">
                <div>Consulta Realizada <strong>com Sucesso</strong> ✅</div>
              </div>
            )}       
            {showNotSuccess && (
              <div className="bg-white border border-blue-700 rounded-md mb-5 p-4 inline-block">
                <div>Consulta Realizada <strong>sem Sucesso</strong> ❌</div>
              </div>
            )}  
            <div className="p-4 grid grid-cols-2 bg-white rounded shadow-md w-full h-[64px] mb-6">
              <SelectPageBar numEmpenhos={respostaAPI.length} itensPorPagina={10}/>
              <div className="font-bold">{respostaAPI.length} itens de empenhos retornados 🧾</div>
            </div>     

            <CardItem empenhos={respostaAPI}/>
          </div>
        )}
      </div>
    </div>
  );
};
