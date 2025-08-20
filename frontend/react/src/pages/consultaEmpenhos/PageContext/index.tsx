import { createContext, useContext, useState, ReactNode } from 'react';


type PageContextType = {
    pageState: number;
    setPageState: (page: number) => void;
};

const PageContext = createContext<PageContextType | undefined>(undefined);


interface PageProviderProps {
  children: ReactNode;
}

export function PageProvider({ children } : PageProviderProps) {
  const [pageState, setPageState] = useState(1);
  
  return (
    <PageContext.Provider value={{ pageState, setPageState }}>         
      <div>
        {children}
      </div>
    </PageContext.Provider>
  );
}



export function usePage() {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("usePage must be used within a PageProvider");
  }
  return context;
}