import { Empenho3DItem } from "../pages/visualizacao3D/types";
import { EmpenhoDetalhe } from "../pages/fracionamento/types";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

export async function fetchAllEmpenhos3D(elemdespesatce : string, ente: string, unidade: string): Promise<Empenho3DItem[]> {
  try {
    const payload = { elemdespesatce: elemdespesatce, ente: ente, unidade: unidade };
    const response = await fetch(`${API_BASE_URL}/api/empenhos-3d`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Erro ao buscar dados 3D no empenhoId: ${elemdespesatce}`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export const fetchAutoComplete = async (query: string, type: number, unidade: string) => {
    if (type !== 1 && !query.trim()) { // type = 1 should ignore 'query'
      return [];
    }

    try {
      const payload = { consulta: query, tipo: type, unidade: unidade };
      const response = await fetch(`${API_BASE_URL}/api/auto-filling`, {
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



export const fetchFracionamentos = async (idunid: string, cluster_id: string, ano: string) => {

    try {
      const payload = { idunid: idunid, cluster_id: cluster_id, ano: ano };
      const response = await fetch(`${API_BASE_URL}/api/fracionamentos`, {
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

export interface VariabilidadeSemanticaItem {
  group_key: string | number;
  group_label?: string | null;
  cnpjraiz: string;
  n_empenhos: number;
  semantic_variability: number | null;
  mean_date: string | null;
  total_value: number | null;
}

export interface VariabilidadeEmpenhoItem {
  id: number;
  idempenho: string;
  ente: string | null;
  idorgao: string | number | null;
  unidade: string | null;
  idunid: string | number | null;
  credor: string | null;
  cnpjraiz: string | null;
  elemdespesatce: string | null;
  dtempenho: string | null;
  vlr_empenhado: number | null;
  historico: string | null;
}

export const fetchVariabilidadeSemantica = async (
  groupBy: "ente" | "jurisdicionado",
  minN: number,
  maxN: number,
  limit: number,
  offset: number,
  groupKey?: string,
  cnpjraiz?: string
): Promise<VariabilidadeSemanticaItem[]> => {
  try {
    const params = new URLSearchParams({
      group_by: groupBy,
      min_n: String(minN),
      max_n: String(maxN),
      limit: String(limit),
      offset: String(offset),
    });
    if (groupKey) params.set("group_key", groupKey);
    if (cnpjraiz) params.set("cnpjraiz", cnpjraiz);
    const response = await fetch(`${API_BASE_URL}/api/variabilidade-semantica?${params.toString()}`);
    if (!response.ok) throw new Error("Erro ao buscar variabilidade semântica.");
    return await response.json();
  } catch (err) {
    console.error("Erro ao buscar variabilidade semântica:", err);
    return [];
  }
};

export const fetchVariabilidadeEmpenhos = async (
  groupBy: "ente" | "jurisdicionado",
  groupKey: string,
  cnpjraiz: string,
  limit: number,
  offset: number,
  orderBy: "dtempenho" | "vlr_empenhado" | "idempenho" = "dtempenho",
  orderDir: "asc" | "desc" = "desc"
): Promise<VariabilidadeEmpenhoItem[]> => {
  try {
    const params = new URLSearchParams({
      group_by: groupBy,
      group_key: groupKey,
      cnpjraiz,
      limit: String(limit),
      offset: String(offset),
      order_by: orderBy,
      order_dir: orderDir,
    });
    const response = await fetch(`${API_BASE_URL}/api/variabilidade-semantica/empenhos?${params.toString()}`);
    if (!response.ok) throw new Error("Erro ao buscar empenhos do grupo.");
    return await response.json();
  } catch (err) {
    console.error("Erro ao buscar empenhos do grupo:", err);
    return [];
  }
};

  export const fetchEmpenhoDetalhe = async (idempenho: string): Promise<EmpenhoDetalhe | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/empenhos/${idempenho}`);
      if (!response.ok) throw new Error("Erro ao carregar detalhes do empenho");
      return await response.json();
    } catch (err) {
      console.error("Erro ao buscar detalhe do empenho:", err);
      return null;
    }
  };
