import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { formatCurrencyBR, formatDateBR } from "../../utils/formatters";

export const SobreprecoResultadosPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [resumo, setResumo] = useState<any | null>(null);
  const [empenhos, setEmpenhos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ano = searchParams.get("ano");
  const descricao = searchParams.get("descricao");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/sobrepreco?ano=${ano}&descricao=${descricao}`
        );
        if (!response.ok) throw new Error("Erro ao carregar dados");
        const data = await response.json();
        setResumo(data.resumo);
        setEmpenhos(data.empenhos || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ano, descricao]);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p className="text-red-600">Erro: {error}</p>;
  if (!resumo) return <p>Nenhum resultado encontrado.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Resultados de Sobrepreço</h1>

      {/* Resumo */}
      <div className="bg-gray-100 p-4 rounded mb-6">
        <p><strong>Ano:</strong> {resumo.ano}</p>
        <p><strong>Descrição:</strong> {resumo.descricao}</p>
        <p><strong>Nº de empenhos semelhantes:</strong> {resumo.n_resultados}</p>
        <p><strong>Valor médio (grupo):</strong> {formatCurrencyBR(resumo.valor_medio)}</p>
        <p><strong>Mediana (grupo):</strong> {formatCurrencyBR(resumo.valor_mediano)}</p>
        <p><strong>Q1:</strong> {formatCurrencyBR(resumo.q1)}</p>
        <p><strong>Q3:</strong> {formatCurrencyBR(resumo.q3)}</p>
        <p><strong>Limiar IQR:</strong> {formatCurrencyBR(resumo.limiar_iqr)}</p>
      </div>

      {/* Tabela de empenhos */}
      <h2 className="text-xl font-semibold mb-2">Empenhos encontrados</h2>
      {empenhos.length === 0 ? (
        <p>Nenhum empenho encontrado.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-3 py-2 text-left">ID</th>
              <th className="border px-3 py-2 text-left">Ente</th>
              <th className="border px-3 py-2 text-left">Elemento</th>
              <th className="border px-3 py-2 text-left">Histórico</th>
              <th className="border px-3 py-2 text-center">Data</th>
              <th className="border px-3 py-2 text-right">Valor</th>
              <th className="border px-3 py-2 text-center">Suspeito?</th>
            </tr>
          </thead>
          <tbody>
            {empenhos.map((e, idx) => (
              <tr key={e.idempenho} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border px-3 py-2">{e.idempenho}</td>
                <td className="border px-3 py-2">{e.ente}</td>
                <td className="border px-3 py-2">{e.elemdespesatce}</td>
                <td className="border px-3 py-2">{e.historico}</td>
                <td className="border px-3 py-2 text-center">
                  {e.dtempenho ? formatDateBR(e.dtempenho) : "-"}
                </td>
                <td className="border px-3 py-2 text-right">
                  {formatCurrencyBR(e.vlr_empenhado)}
                </td>
                <td className="border px-3 py-2 text-center">
                  {e.vlr_empenhado > resumo.limiar_iqr ? "✅" : "❌"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
