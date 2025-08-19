import React from "react";
import { Empenho3DItem } from "./types";

interface Props {
  item: Empenho3DItem;
  onClose: () => void;
}

export const ItemModal: React.FC<Props> = ({ item, onClose }) => {
  return (
    <>
      {/* Backdrop escurecido */}
      <div
        className="fixed inset-0 bg-black/50 z-[1000]"
        onClick={onClose}
      />

      {/* Modal fixo */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                  bg-white p-6 rounded-lg shadow-lg z-[1001] max-w-[400px] w-[90%]"
        onClick={(e) => e.stopPropagation()} // Evita fechar ao clicar dentro do modal
      >
        <h2>Detalhes do Item</h2>
        <p><strong>ID:</strong> {item.id}</p>
        <p><strong>Descrição:</strong> {item.descricao}</p>
        <p><strong>Coordenadas:</strong></p>
        <ul>
          <li><strong>X:</strong> {item.x.toFixed(2)}</li>
          <li><strong>Y:</strong> {item.y.toFixed(2)}</li>
          <li><strong>Z:</strong> {item.z.toFixed(2)}</li>
        </ul>
        <p><strong>Cor:</strong> <span style={{ color: item.color }}>{item.color}</span></p>
        <div style={{ textAlign: "right", marginTop: "16px" }}>
          <button onClick={onClose}>Fechar</button>
        </div>
      </div>
    </>
  );
};
