import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Visualizacao3DPage } from "pages/visualizacao3D/Visualizacao3DPage";
import { LandingPage } from "pages/home/landingPage";
import { ConsultasEmpenhos } from "pages/consultaEmpenhos/ConsultaEmpenhosPage";
import { LoginPage } from "./pages/logIn/LogInPage";
import { PrivateRoute } from "./components/PrivateRoute";
import Navbar from "./components/Navbar";
import { Fracionamentos } from "./pages/fracionamento/Fracionamentos";
import Configuracoes from "./pages/Configuracoes";

// Novas páginas
import { SobreprecoFormPage } from "./pages/sobrepreco/SobreprecoFormPage";
import { SobreprecoResultadosPage } from "./pages/sobrepreco/SobreprecoResultadosPage";

export default function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <LandingPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <PrivateRoute>
              <Configuracoes />
            </PrivateRoute>
          }
        />
        <Route
          path="/visualizer"
          element={
            <PrivateRoute>
              <Visualizacao3DPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/query"
          element={
            <PrivateRoute>
              <ConsultasEmpenhos />
            </PrivateRoute>
          }
        />
        <Route
          path="/tabela_fracionamento"
          element={
            <PrivateRoute>
              <Fracionamentos />
            </PrivateRoute>
          }
        />

        {/* Novo fluxo de sobrepreço */}
        <Route
          path="/sobrepreco"
          element={
            <PrivateRoute>
              <SobreprecoFormPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sobrepreco/resultados"
          element={
            <PrivateRoute>
              <SobreprecoResultadosPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}
