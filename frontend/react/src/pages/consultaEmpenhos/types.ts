
interface EmpenhoMetadata {
  idempenho: string;
  ente: string;
  unidade: string;
  elemdespesatce: string;
  credor: string;
  vlr_empenho: string;
}

export interface EmpenhoItem {
  document: string;
  metadata: EmpenhoMetadata;
  distance: number | null;
}

interface CardItemProps {
  empenhos: EmpenhoItem[];
}

export type Suggestion = {
  best_match: string;
  score: number;
};