import { Empenho3DItem } from "./types";

// export async function fetchEmpenhos3D(): Promise<Empenho3DItem[]> {
//   try {
//     const response = await fetch("http://localhost:8000/api/empenhos-3d");
//     if (!response.ok) throw new Error("Erro ao buscar dados 3D");
//     return await response.json();
//   } catch (error) {
//     console.error(error);
//     return [];
//   }
// }


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