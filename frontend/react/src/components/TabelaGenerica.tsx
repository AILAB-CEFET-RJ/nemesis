import React, { useState } from "react";

interface TabelaGenericaProps {
  data: any[];
}

export const TabelaGenerica: React.FC<TabelaGenericaProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  if (!data || data.length === 0) {
    return <p className="text-gray-600">Nenhum dado disponível.</p>;
  }

  // Pega as chaves do primeiro objeto para montar o cabeçalho
  const keys = Object.keys(data[0]);

  // Funções auxiliares de formatação
  const formatValue = (key: string, value: any) => {
    if (value == null) return "-";

    // Valores monetários
    if (key.toLowerCase().includes("valor") || key.toLowerCase().includes("vlr")) {
      return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    // Datas
    if (key.toLowerCase().includes("data") || key.toLowerCase().includes("dt")) {
      try {
        return new Date(value).toLocaleDateString("pt-BR");
      } catch {
        return value;
      }
    }

    // Campo booleano de sobrepreço
    if (key === "sobrepreco_suspeito") {
      return value ? (
        <span className="text-red-600 font-bold">🚨 Sim</span>
      ) : (
        <span className="text-green-600 font-bold">✅ Não</span>
      );
    }

    // Números em geral
    if (typeof value === "number") {
      return value.toLocaleString("pt-BR");
    }

    return String(value);
  };

  // Ordenação
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = a[key];
    const valB = b[key];
    if (valA == null || valB == null) return 0;

    // Ordena datas
    if (key.toLowerCase().includes("data") || key.toLowerCase().includes("dt")) {
      const dateA = new Date(valA).getTime();
      const dateB = new Date(valB).getTime();
      return direction === "asc" ? dateA - dateB : dateB - dateA;
    }

    // Ordena números
    if (typeof valA === "number" && typeof valB === "number") {
      return direction === "asc" ? valA - valB : valB - valA;
    }

    // Ordena texto
    return direction === "asc"
      ? String(valA).localeCompare(String(valB), "pt-BR")
      : String(valB).localeCompare(String(valA), "pt-BR");
  });

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            {keys.map((key) => (
              <th
                key={key}
                onClick={() => handleSort(key)}
                className="border px-3 py-2 text-left font-semibold text-sm cursor-pointer select-none"
              >
                {key}
                {sortConfig?.key === key && (
                  <span className="ml-1">{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {keys.map((key) => (
                <td key={key} className="border px-3 py-2 text-sm">
                  {formatValue(key, row[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
