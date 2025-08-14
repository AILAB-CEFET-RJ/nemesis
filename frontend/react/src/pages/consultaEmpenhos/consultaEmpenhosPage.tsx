import React, { useState, useEffect } from "react";
import CardItem from './CardItem'
import { EmpenhoItem } from "./types";


export const ConsultasEmpenhos: React.FC = () => {
  const [unidade, setUnidade] = useState("");
  const [elementoDespesa, setElementoDespesa] = useState("");
  const [credor, setCredor] = useState("");
  const [historico, setHistorico] = useState("");
  const [respostaAPI, setRespostaAPI] = useState<EmpenhoItem[] | null>(null);
  const [loading, setLoading] = useState(false); 
  const [showSuccess, setShowSuccess] = useState(false);
  const [showNotSuccess, setShowNotSuccess] = useState(false);

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

  return (
    <div className="flex flex-col items-center min-h-screen p-8 bg-gray-100 font-sans">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md mb-6"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          Consulta de Empenhos
        </h1>

        <label className="block mb-2">Unidade:</label>
        <input
          type="text"
          value={unidade}
          onChange={(e) => setUnidade(e.target.value)}
          placeholder="Digite a unidade"
          className="w-full p-2 mb-4 border border-gray-300 rounded"
        />

        <label className="block mb-2">Elemento da Despesa:</label>
        <input
          type="text"
          value={elementoDespesa}
          onChange={(e) => setElementoDespesa(e.target.value)}
          placeholder="Digite o elemento da despesa"
          className="w-full p-2 mb-4 border border-gray-300 rounded"
        />

        <label className="block mb-2">Credor:</label>
        <input
          type="text"
          value={credor}
          onChange={(e) => setCredor(e.target.value)}
          placeholder="Digite o credor"
          className="w-full p-2 mb-4 border border-gray-300 rounded"
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
          className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Consultar
        </button>
      </form>

      <div className="w-full max-w-3xl">
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
                <div>{respostaAPI.length} itens de empenhos retornados.</div>
              </div>
            )}       
            {showNotSuccess && (
              <div className="bg-white border border-blue-700 rounded-md mb-5 p-4 inline-block">
                <div>Consulta Realizada <strong>sem Sucesso</strong> ❌</div>
                <div>{respostaAPI.length} itens de empenhos retornados.</div>
              </div>
            )}       

            <CardItem empenhos={respostaAPI}/>
          </div>
        )}
      </div>
    </div>
  );
};

// JSON.stringify(respostaAPI, null, 2)