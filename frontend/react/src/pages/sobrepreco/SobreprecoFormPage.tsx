import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const SobreprecoFormPage: React.FC = () => {
  const [ano, setAno] = useState("2019");
  const [descricao, setDescricao] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      alert("Por favor, digite uma descrição para análise.");
      return;
    }
    navigate(
      `/sobrepreco/resultados?ano=${ano}&descricao=${encodeURIComponent(
        descricao
      )}`
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-sans p-6">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Análise de Sobrepreço</h1>
        <p className="text-gray-600 mb-6">
          Selecione os parâmetros para iniciar a análise:
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-left font-semibold mb-1">Ano</label>
            <select
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              className="border rounded p-2 w-full"
            >
              <option value="2018">2018</option>
              <option value="2019">2019</option>
              <option value="2020">2020</option>
              <option value="2021">2021</option>
            </select>
          </div>

          <div>
            <label className="block text-left font-semibold mb-1">
              Descrição (Histórico)
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: paracetamol"
              className="border rounded p-2 w-full"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Analisar
          </button>
        </form>
      </div>
    </div>
  );
};
