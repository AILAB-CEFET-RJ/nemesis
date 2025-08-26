import { Empenho3DItem } from "../pages/visualizacao3D/types";

export async function fetchAllEmpenhos3D(empenhoId : string): Promise<Empenho3DItem[]> {
  try {
    const payload = { empenhoId: empenhoId };
    const response = await fetch("http://localhost:8000/api/empenhos-3d", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Erro ao buscar dados 3D no empenhoId: ${empenhoId}`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export const fetchAutoComplete = async (query: string, type: number) => {
    if (!query.trim()) {
      return [];
    }

    try {
      const payload = { consulta: query, tipo: type };
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

