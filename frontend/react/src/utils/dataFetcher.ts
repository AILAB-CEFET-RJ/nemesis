import { Empenho3DItem } from "../pages/visualizacao3D/types";

export async function fetchAllEmpenhos3D(elem_id : string, ente: string, unidade: string): Promise<Empenho3DItem[]> {
  try {
    const payload = { elem_id: elem_id, ente: ente, unidade: unidade };
    const response = await fetch("http://localhost:8000/api/empenhos-3d", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Erro ao buscar dados 3D no empenhoId: ${elem_id}`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export const fetchAutoComplete = async (query: string, type: number, city: string) => {
    if (!query.trim()) {
      return [];
    }

    try {
      const payload = { consulta: query, tipo: type, city: city };
      const response = await fetch("http://localhost:8000/api/auto-filling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();  
      return data;

    } catch (err) {
      console.error("Erro ao buscar sugestões:", err);
      return err;
    } 
  };



  export const fetchFracionamentos = async (idunid: string, cluster_id: string) => {

    try {
      const payload = { idunid: idunid, cluster_id: cluster_id };
      const response = await fetch("http://localhost:8000/api/fracionamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();  
      return data;

    } catch (err) {
      console.error("Erro ao buscar tabela .csv:", err);
      return err;
    } 
  };

