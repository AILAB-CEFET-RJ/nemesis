
interface EmpenhoMetadata {
  ElemDespesaTCE: string;
  Credor: string;
  Vlr_Empenhado: number;
  Clusters: string;
  Unidade: string;
}

export interface EmpenhoItem {
  document: string;
  metadata: EmpenhoMetadata;
  distance: number | null;
}

interface CardItemProps {
  empenhos: EmpenhoItem[];
}

