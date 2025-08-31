import React from "react";
import { User, Settings, Palette } from "lucide-react";

const Configuracoes: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">⚙️ Configurações</h1>

      {/* Perfil */}
      <div className="bg-white shadow-md rounded-2xl p-4">
        <div className="flex items-center space-x-2 mb-3">
          <User className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Perfil</h2>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Gerencie suas informações de perfil.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Nome</label>
            <input
              type="text"
              placeholder="Seu nome"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="email@exemplo.com"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Preferências */}
      <div className="bg-white shadow-md rounded-2xl p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Palette className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold">Preferências</h2>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Personalize suas preferências de uso.
        </p>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-sm">Ativar modo escuro</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-sm">Receber notificações</span>
          </label>
        </div>
      </div>

      {/* Sistema */}
      <div className="bg-white shadow-md rounded-2xl p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Settings className="w-5 h-5 text-green-500" />
          <h2 className="text-lg font-semibold">Sistema</h2>
        </div>
        <button className="w-full p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
          Sair da conta
        </button>
      </div>
    </div>
  );
};

export default Configuracoes;
