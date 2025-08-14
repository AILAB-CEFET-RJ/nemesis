import React, { useState } from "react";
import { usePage } from "/home/vinix/nemesis/frontend/react/src/contexts/PageContext";

interface SelectPageBarProps {
  numEmpenhos: number; // total de itens retornados
  itensPorPagina: number; // para calcular quantas páginas existem
}



const SelectPageBar: React.FC<SelectPageBarProps> = ({ numEmpenhos, itensPorPagina }) => {
  const { pageState, setPageState } = usePage();

  // calcular total de páginas
  const totalPaginas = Math.ceil(numEmpenhos / itensPorPagina);

  // criar lista de opções
  const options = Array.from({ length: totalPaginas }, (_, i) => ({
    value: i + 1,
    label: `Página ${i + 1}`,
  }));

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const pagina = Number(event.target.value);
    setPageState(pagina);
  };

  return (
    <div className="flex items-center gap-2 mb-6">
      <label htmlFor="pageSelect">Ir para página:</label>
      <select
        id="pageSelect"
        value={pageState}
        onChange={handleChange}
        className="border p-1 rounded"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};


export default SelectPageBar;