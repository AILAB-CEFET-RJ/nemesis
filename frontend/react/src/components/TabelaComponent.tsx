import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Fracionamento } from "../pages/fracionamento/types";
import { fetchFracionamentos } from '../utils/dataFetcher'

interface TabelaComponentProps {
  setAbrirTabela: Dispatch<SetStateAction<boolean>>;
  idUnid: string;
}

export function TabelaComponent({ setAbrirTabela, idUnid }: TabelaComponentProps) {
  const [tabela, setTabela] = useState<Fracionamento[]>([]);
  const [clusterId, setClusterId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // buscar dados sempre que idUnid mudar
  useEffect(() => {
    if (!idUnid) return;

    const handleTabela = async () => {
      try {
        setLoading(true);
        setError(null);
        const results = await fetchFracionamentos(idUnid, clusterId);
        setTabela(Array.isArray(results) ? results : []);
      } catch (err) {
        setError("Erro ao buscar dados de fracionamento");
      } finally {
        setLoading(false);
      }
    };

    handleTabela();
  }, [idUnid, clusterId]);

  return (
    <div className="p-6">
      <button
        onClick={() => setAbrirTabela(false)}
        className="mb-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
      >
        Voltar
      </button>

      {clusterId !== "" && (
        <button
        onClick={() => setClusterId("")}
        className="mb-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 ml-4"
      >
        Buscar outro Cluster ID
      </button>
      )}
      

      <h2 className="text-xl font-bold">Tabela de Fracionamentos</h2>
      <h2 className="text-md text-gray-500 p-2 mb-2">Selecione um Cluster ID</h2>

      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && tabela.length === 0 && <p>Nenhum dado encontrado.</p>}

      {clusterId !== "" && (
        <div>
          {tabela.length > 0 && (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left">ID</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Elemento da Despesa</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Valor</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Histórico</th>
                </tr>
              </thead>
                <tbody>
                {tabela.map((item: Fracionamento, idx: number) => (
                  <tr
                  key={item.idempenho}
                  className={idx % 2 === 0 ? "bg-white" : "bg-yellow-100"}
                  >
                  <td className="border border-gray-300 px-3 py-2">{item.idempenho}</td>
                  <td className="border border-gray-300 px-3 py-2">{item.elemdespesatce}</td>
                  <td className="border border-gray-300 px-3 py-2">
                    {item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{item.historico}</td>
                  </tr>
                ))}
                </tbody>
            </table>
          )}
        </div>
      )}
      {clusterId === "" && (
        <div>
          {tabela.length > 0 && (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-center">Cluster ID</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Cluster Size</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Min Sim</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Max Sim</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Valor Médio</th>
                </tr>
              </thead>
              <tbody>
                {tabela.map((item: Fracionamento, idx: number) => (
                  <tr key={item.idempenho} className={idx % 2 === 0 ? "bg-white" : "bg-yellow-100"}>
                    <td
                      className="border border-gray-300 px-3 py-2 text-center cursor-pointer hover:bg-blue-100"
                      onClick={() => setClusterId(String(item.cluster_id))}
                    >
                      {item.cluster_id}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{item.cluster_size}</td>
                    <td className="border border-gray-300 px-3 py-2">{item.min_sim}</td>
                    <td className="border border-gray-300 px-3 py-2">{item.max_sim}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      {item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
