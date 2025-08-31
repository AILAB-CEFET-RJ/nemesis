// UnidadesContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fetchAutoComplete } from "../../utils/dataFetcher";


type UnidadesType = {
  [ente: string]: [string, string][]; // { ente: [[unid, idunid], ...] }
};

type UnidadesContextType = {
  unidades: UnidadesType;
  loading: boolean;
};

const UnidadesContext = createContext<UnidadesContextType>({
  unidades: {},
  loading: true,
});

export const useUnidades = () => useContext(UnidadesContext);

export function UnidadesProvider({ children }: { children: ReactNode }) {
  const [unidades, setUnidades] = useState<UnidadesType>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchAutoComplete("", 1, "");
        setUnidades(result);
      } catch (err) {
        console.error("❌ Erro ao carregar unidades:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <UnidadesContext.Provider value={{ unidades, loading }}>
      {children}
    </UnidadesContext.Provider>
  );
}