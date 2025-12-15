import React, { useState } from "react";
import { usePage } from "../../context/PageContext";

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
    <div className="flex items-center gap-3 text-slate-200">
      <label htmlFor="pageSelect" className="text-xs uppercase tracking-wide">
        Selecione a página:
      </label>
      <select
        id="pageSelect"
        value={pageState}
        onChange={handleChange}
        className="rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-300 focus:bg-slate-800"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="text-slate-900">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};


export default SelectPageBar;
