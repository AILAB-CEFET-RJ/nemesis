import React from "react";
import { Empenho3DCanvas } from "./Empenho3DCanvas";

export const Visualizacao3DPage: React.FC = () => {
  return (
    <div>
      <h1>Visualização de Itens de Empenho</h1>
      <Empenho3DCanvas />
    </div>
  );
};
