import { Empenho3DItem } from "./types";

export async function fetchEmpenhos3D(): Promise<Empenho3DItem[]> {
  try {
    const response = await fetch("http://localhost:8000/api/empenhos-3d");
    if (!response.ok) throw new Error("Erro ao buscar dados 3D");
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}
