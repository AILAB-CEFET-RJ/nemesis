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

  return (
    <div>
      {currentItems.map((emp, idx) => (
        <div
          key={idx}
          className="mb-5 rounded-2xl border border-white/15 bg-white text-slate-900 shadow-xl"
        >
          <div className="grid gap-3 px-5 py-4 text-sm leading-relaxed">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wide text-slate-500">
              <span>ID {emp.metadata.idempenho}</span>
              {emp.distance !== null && (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                  Score: {emp.distance.toFixed(4)}
                </span>
              )}
            </div>

            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-800">
              <span className="font-semibold text-slate-600">Histórico:</span> {emp.document}
            </p>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <span className="text-xs font-semibold uppercase text-slate-500">Município</span>
                <p>{emp.metadata.ente}</p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase text-slate-500">Jurisdicionado</span>
                <p>{emp.metadata.unidade}</p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase text-slate-500">Elemento da Despesa</span>
                <p>{emp.metadata.elemdespesatce}</p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase text-slate-500">Credor</span>
                <p>{emp.metadata.credor}</p>
              </div>
            </div>

            <p className="text-base font-semibold text-slate-700">
              Valor empenhado:{" "}
              <span className="text-slate-900">
                R$
                {Number(emp.metadata.vlr_empenho).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardItem;
