import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Visualizacao3DPage } from "pages/visualizacao3D/Visualizacao3DPage";
import { LandingPage } from "pages/home/landingPage";
import { ConsultasEmpenhos } from "pages/consultaEmpenhos/consultaEmpenhosPage";

export default function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Home</Link> |{" "}
        <Link to="/visualizer">3D Visualizer</Link> |{" "}
        <Link to="/query">Query</Link>
      </nav>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/visualizer" element={<Visualizacao3DPage />} />
        <Route path="/query" element={<ConsultasEmpenhos />} />
      </Routes>
    </Router>
  );
}
