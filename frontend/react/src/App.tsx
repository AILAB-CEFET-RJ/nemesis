import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Visualizacao3DPage } from "pages/visualizacao3D/Visualizacao3DPage";
import { LandingPage } from "pages/home/landingPage";
import { ConsultasEmpenhos } from "pages/consultaEmpenhos/ConsultaEmpenhosPage";
import { LoginPage } from "./pages/logIn/LogInPage";
import { PrivateRoute } from "./components/PrivateRoute";
import Navbar from "./components/Navbar";
import { Fracionamentos } from "./pages/fracionamento/Fracionamentos";
import { VariabilidadeSemanticaPage } from "./pages/variabilidade/VariabilidadeSemanticaPage";

// Novas páginas
import { SobreprecoFormPage } from "./pages/sobrepreco/SobreprecoFormPage";
import { SobreprecoResultadosPage } from "./pages/sobrepreco/SobreprecoResultadosPage";

const AppRoutes = () => {
  const location = useLocation();
  const hideNavbar = location.pathname === "/login";

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <LandingPage />
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
        <Route
          path="/variabilidade-semantica"
          element={
            <PrivateRoute>
              <VariabilidadeSemanticaPage />
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
    </>
  );
}

export default function App() {
  return (
    <Router basename="/nemesis">
      <AppRoutes />
    </Router>
  );
}
