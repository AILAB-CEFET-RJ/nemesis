import React, { useState } from "react";

export const ConsultasEmpenhos: React.FC = () => {
  const [unidade, setUnidade] = useState("");
  const [elementoDespesa, setElementoDespesa] = useState("");
  const [credor, setCredor] = useState("");
  const [historico, setHistorico] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ unidade, elementoDespesa, credor, historico });
  };

  return (
    <div className="flex justify-center items-start min-h-screen p-8 bg-gray-100 font-sans">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg"
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
    </div>
  );
};
