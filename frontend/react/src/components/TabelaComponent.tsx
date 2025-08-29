import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Fracionamento } from "../pages/fracionamento/types";
import { fetchFracionamentos } from '../utils/dataFetcher'

interface TabelaComponentProps {
  setAbrirTabela: Dispatch<SetStateAction<boolean>>;
  idUnid: string;
}

export function TabelaComponent({ setAbrirTabela, idUnid }: TabelaComponentProps) {
  const [tabela, setTabela] = useState<Fracionamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // buscar dados sempre que idUnid mudar
  useEffect(() => {
    if (!idUnid) return;

    const handleTabela = async () => {
      try {
        setLoading(true);
        setError(null);
        const results = await fetchFracionamentos(idUnid);
        setTabela(Array.isArray(results) ? results : []);
      } catch (err) {
        setError("Erro ao buscar dados de fracionamento");
      } finally {
        setLoading(false);
      }
    };

    handleTabela();
  }, [idUnid]);

  return (
    <div className="p-6">
      <button
        onClick={() => setAbrirTabela(false)}
        className="mb-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
      >
        Voltar
      </button>

      <h2 className="text-xl font-bold mb-4">Fracionamentos</h2>

      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && tabela.length === 0 && <p>Nenhum dado encontrado.</p>}

      {tabela.length > 0 && (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">ID</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Cluster ID</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Cluster Size</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Data</th>
            </tr>
          </thead>
          <tbody>
            {tabela.map((item: Fracionamento) => (
              <tr key={item.idempenho} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2">{item.idempenho}</td>
                <td className="border border-gray-300 px-3 py-2">{item.cluster_id}</td>
                <td className="border border-gray-300 px-3 py-2">{item.cluster_size}</td>
                <td className="border border-gray-300 px-3 py-2">{item.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
