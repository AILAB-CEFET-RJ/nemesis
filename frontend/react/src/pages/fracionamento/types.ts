export interface Fracionamento {
    cluster_id: number;
    cluster_size: number;
    min_sim: number;
    max_sim: number;
    idunid: string;
    elemdespesatce: string;
    idempenho: string;
    data: string;
    valor: number;
    historico: string;
}

export interface EmpenhoDetalhe {
    idempenho: string;
    ano: number;
    ente: string;
    unidade: string;
    idunid: string;
    elemdespesatce: string;
    credor: string;
    dtempenho: string;
    historico: string;
    valor: number;
}
