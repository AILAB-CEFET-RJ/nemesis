import { EmpenhoItem } from "./types";
import { usePage } from "/home/vinix/nemesis/frontend/react/src/contexts/PageContext";

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
        <div key={idx} className="bg-white border border-red-500 rounded-md mb-5 p-4 shadow">
          <div><strong>Histórico:</strong> {emp.document}</div>
          <div><strong>Unidade:</strong> {emp.metadata.Unidade}</div>
          <div><strong>Elemento da Despesa:</strong> {emp.metadata.ElemDespesaTCE}</div>
          <div><strong>Credor:</strong> {emp.metadata.Credor}</div>
          <div><strong>Cluster:</strong> {emp.metadata.Clusters}</div>
            <div>
            <strong>Valor Empenhado: </strong>R$
            {Number(emp.metadata.Vlr_Empenhado).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            </div>
          <div>
            {emp.distance !== null && (
              <div><strong>Distance:</strong> {emp.distance}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardItem;
