import React from "react";
import { EmpenhoItem } from "./types";
import { usePage } from "../../context/PageContext";

interface CardItemProps {
  empenhos: EmpenhoItem[];
}

const ITEMS_PER_PAGE = 10;

const CardItem: React.FC<CardItemProps> = ({ empenhos }) => {

  const { pageState } = usePage();

  // Índices para o slice
  const startIndex = (pageState - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  // Apenas os itens da página atual
  const currentItems = empenhos.slice(startIndex, endIndex);

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleDateString("pt-BR");
  };

  return (
    <div>
      {currentItems.map((emp, idx) => (
        <div
          key={idx}
          className="mb-5 rounded-2xl border border-white/15 bg-white text-slate-900 shadow-xl"
        >
          <div className="grid gap-3 px-5 py-4 text-sm leading-relaxed">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs tracking-wide text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                ID {emp.metadata.idempenho}
              </span>
              {emp.distance !== null && (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                  Similaridade: {emp.distance.toFixed(3)}
                </span>
              )}
            </div>

            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-800">
              <span className="font-semibold text-slate-600">Histórico:</span> {emp.document}
            </p>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <span className="text-xs font-semibold text-slate-500">Município</span>
                <p>{emp.metadata.ente}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500">Jurisdicionado</span>
                <p>{emp.metadata.unidade}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500">Elemento da despesa</span>
                <p>{emp.metadata.elemdespesatce}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500">Credor</span>
                <p>{emp.metadata.credor}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500">Data do empenho</span>
                <p>{formatDate(emp.metadata.dtempenho)}</p>
              </div>
            </div>

            <div className="text-base font-semibold text-slate-700">
              <span className="text-slate-600">Valor empenhado: </span>
              <span className="text-slate-900">
                R$
                {Number(emp.metadata.vlr_empenho).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardItem;
