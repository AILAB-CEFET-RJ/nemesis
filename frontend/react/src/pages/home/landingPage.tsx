import React from "react";
import { Link } from "react-router-dom";

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-sans p-6">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Seja bem-vindo(a) ao NEMESIS</h1>
        <h3 className="text-[18px] text-gray-800 mb-4">Notas de EMPenho com Estratégia Semântica e Inteligência de Sistemas</h3>
        <p className="text-gray-600 mt-8 mb-5">
          Escolha para onde ir:
        </p>

        <div className="flex flex-col gap-4">
          <Link to="/visualizer">
            <button className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              Projeção 3-D dos Empenhos
            </button>
          </Link>

          <Link to="/query">
            <button className="w-full py-3 bg-green-600 text-white rounded hover:bg-green-700 transition mt-2">
             Consultar o Banco de Dados
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
