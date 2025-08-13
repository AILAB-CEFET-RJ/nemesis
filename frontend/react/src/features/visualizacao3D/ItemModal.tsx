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
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000
        }}
        onClick={onClose}
      />

      {/* Modal fixo */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#fff",
          padding: "24px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          zIndex: 1001,
          maxWidth: "400px",
          width: "90%",
        }}
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
        <p><strong>Cluster:</strong> {item.cluster}</p>
        <p><strong>Cor:</strong> <span style={{ color: item.color }}>{item.color}</span></p>
        <div style={{ textAlign: "right", marginTop: "16px" }}>
          <button onClick={onClose}>Fechar</button>
        </div>
      </div>
    </>
  );
};
