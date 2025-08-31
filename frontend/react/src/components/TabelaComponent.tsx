import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Fracionamento } from "../pages/fracionamento/types";
import { fetchFracionamentos } from '../utils/dataFetcher';
import * as Tooltip from "@radix-ui/react-tooltip";
import { FolderOpen, Home } from "lucide-react";
import { GrupoCharts } from "./GrupoCharts";
import { formatCurrencyBR, formatNumberBR, formatIntegerBR, formatDateBR } from "../utils/formatters";

interface TabelaComponentProps {
  setAbrirTabela: Dispatch<SetStateAction<boolean>>;
  idUnid: string;
}

export function TabelaComponent({ setAbrirTabela, idUnid }: TabelaComponentProps) {
  const [tabela, setTabela] = useState<Fracionamento[]>([]);
  const [clusterId, setClusterId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

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

  function handleSort(key: string) {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  }

  const sortedTabela = [...tabela].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = (a as any)[key];
    const valB = (b as any)[key];
    if (valA == null || valB == null) return 0;

    if (key.toLowerCase().includes("data")) {
      const dateA = new Date(valA).getTime();
      const dateB = new Date(valB).getTime();
      return direction === "asc" ? dateA - dateB : dateB - dateA;
    }
    if (typeof valA === "number" && typeof valB === "number") {
      return direction === "asc" ? valA - valB : valB - valA;
    }
    return direction === "asc"
      ? String(valA).localeCompare(String(valB), "pt-BR")
      : String(valB).localeCompare(String(valA), "pt-BR");
  });

  const grupoSelecionado = clusterId
    ? tabela.find((item) => String(item.cluster_id) === clusterId)
    : null;
  const valorTotalGrupo =
    clusterId !== "" ? tabela.reduce((acc, item) => acc + (item.valor || 0), 0) : 0;

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-600 mb-4">
        <span
          className="flex items-center gap-1 cursor-pointer hover:underline text-blue-600"
          onClick={() => {
            setAbrirTabela(false); // fecha tudo
            setClusterId("");
            setSortConfig(null);
          }}
        >
          <Home size={16} /> Início
        </span>

        <span className="mx-2">{">"}</span>

        <span
          className={`cursor-pointer hover:underline ${
            clusterId !== "" ? "text-blue-600" : "font-semibold"
          }`}
          onClick={() => {
            if (clusterId !== "") {
              setClusterId("");
              setSortConfig(null);
            }
          }}
        >
          Grupos de Fracionamentos
        </span>

        {clusterId !== "" && (
          <>
            <span className="mx-2">{">"}</span>
            <span className="font-semibold">Grupo {clusterId}</span>
          </>
        )}
      </div>

      {clusterId !== "" && (
        <button
          onClick={() => {
            setClusterId("");
            setSortConfig(null);
          }}
          className="mb-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Voltar aos Grupos
        </button>
      )}

      <h2 className="text-xl font-bold">Grupos de Fracionamentos</h2>
      <h2 className="text-md text-gray-500 p-2 mb-2">
        {clusterId === ""
          ? "Clique no ID do grupo para ver seus empenhos componentes."
          : `Visualizando o grupo ${clusterId}${
              grupoSelecionado
                ? ` (Tamanho: ${formatIntegerBR(grupoSelecionado.cluster_size)}, Valor Total: ${formatCurrencyBR(valorTotalGrupo)})`
                : ""
            }`}
      </h2>

      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && tabela.length === 0 && <p>Nenhum dado encontrado.</p>}

      {/* Tabela de empenhos detalhados */}
      {clusterId !== "" && (
        <div>
          {tabela.length > 0 && (
            <>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th onClick={() => handleSort("idempenho")} className="border px-3 py-2 text-left cursor-pointer select-none">
                      ID {sortConfig?.key === "idempenho" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th onClick={() => handleSort("elemdespesatce")} className="border px-3 py-2 text-left cursor-pointer select-none">
                      Elemento da Despesa {sortConfig?.key === "elemdespesatce" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th onClick={() => handleSort("data")} className="border px-3 py-2 text-center cursor-pointer select-none">
                      Data {sortConfig?.key === "data" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th onClick={() => handleSort("valor")} className="border px-3 py-2 text-right cursor-pointer select-none">
                      Valor {sortConfig?.key === "valor" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th onClick={() => handleSort("historico")} className="border px-3 py-2 text-left cursor-pointer select-none">
                      Histórico {sortConfig?.key === "historico" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTabela.map((item: Fracionamento, idx: number) => (
                    <tr key={item.idempenho} className={idx % 2 === 0 ? "bg-white" : "bg-yellow-100"}>
                      <td className="border px-3 py-2">{item.idempenho}</td>
                      <td className="border px-3 py-2">{item.elemdespesatce}</td>
                      <td className="border px-3 py-2 text-center">
                        {item.data ? formatDateBR(item.data) : "-"}
                      </td>
                      <td className="border px-3 py-2 text-right">{formatCurrencyBR(item.valor)}</td>
                      <td className="border px-3 py-2">{item.historico}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Gráficos do grupo */}
              <GrupoCharts dados={tabela} />
            </>
          )}
        </div>
      )}

      {/* Tabela de grupos */}
      {clusterId === "" && (
        <div>
          {tabela.length > 0 && (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th onClick={() => handleSort("cluster_id")} className="border px-3 py-2 text-center cursor-pointer select-none">
                    ID {sortConfig?.key === "cluster_id" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("cluster_size")} className="border px-3 py-2 text-right cursor-pointer select-none">
                    Tamanho do Grupo {sortConfig?.key === "cluster_size" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("min_sim")} className="border px-3 py-2 text-right cursor-pointer select-none">
                    Similaridade Mínima {sortConfig?.key === "min_sim" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("max_sim")} className="border px-3 py-2 text-right cursor-pointer select-none">
                    Similaridade Máxima {sortConfig?.key === "max_sim" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("valor")} className="border px-3 py-2 text-right cursor-pointer select-none">
                    Valor Médio {sortConfig?.key === "valor" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTabela.map((item: Fracionamento, idx: number) => (
                  <tr key={item.idempenho} className={idx % 2 === 0 ? "bg-white" : "bg-yellow-100"}>
                    <td className="border px-3 py-2 text-center">
                      <Tooltip.Provider delayDuration={200}>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setClusterId(String(item.cluster_id));
                                setSortConfig(null);
                              }}
                              className="flex items-center justify-center gap-1 text-blue-600 hover:underline cursor-pointer"
                            >
                              {item.cluster_id}
                              <FolderOpen size={16} className="inline-block" />
                            </a>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              side="top"
                              className="bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm shadow-md"
                            >
                              Ver empenhos componentes desse grupo.
                              <Tooltip.Arrow className="fill-gray-900" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </td>
                    <td className="border px-3 py-2 text-right">{formatIntegerBR(item.cluster_size)}</td>
                    <td className="border px-3 py-2 text-right">{formatNumberBR(item.min_sim)}</td>
                    <td className="border px-3 py-2 text-right">{formatNumberBR(item.max_sim)}</td>
                    <td className="border px-3 py-2 text-right">{formatCurrencyBR(item.valor)}</td>
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
