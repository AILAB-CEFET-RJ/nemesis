import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { logout, getCurrentUser } from "../utils/auth"; // clears localStorage

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
  const currentUser = getCurrentUser() || "Usuário";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);


  return (
    <>
    <nav className="relative z-50 bg-blue-600 h-20 flex items-center justify-between px-6 shadow-md">
      {/* Logo */}
      <Link to="/home" className="flex items-center">
        <img
          src={require("../assets/logo.png")}
          alt="App Logo"
          className="h-20 w-20"
        />
      </Link>

      {/* Spacer to keep avatar aligned right now that we removed nav links */}
      <div className="flex-1" />

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 text-white hover:text-gray-200 transition"
        >
          <span className="text-xl">👤</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-44 rounded-lg border border-white/10 bg-slate-900 text-white shadow-lg py-2">
            <div className="px-4 py-2 text-xs uppercase tracking-wide text-slate-400">
              Sua sessão
            </div>
            <button
              onClick={() => {
                setMenuOpen(false);
                setShowProfile(true);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition"
            >
              Perfil
            </button>
            <a
              href="http://eic.cefet-rj.br/nemesis/"
              target="_blank"
              rel="noreferrer"
              className="block w-full px-4 py-2 text-sm hover:bg-white/10 transition"
              onClick={() => setMenuOpen(false)}
            >
              Ajuda / Docs
            </a>
            <div className="my-1 border-t border-white/10" />
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-rose-200 hover:bg-white/10 transition"
            >
              Desconectar
            </button>
          </div>
        )}
      </div>
    </nav>

    {showProfile && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Perfil</h3>
            <button
              onClick={() => setShowProfile(false)}
              className="rounded-full border border-white/20 px-3 py-1 text-sm text-slate-200 hover:border-white/40"
            >
              Fechar
            </button>
          </div>
          <dl className="space-y-3 text-sm text-slate-200">
            <div>
              <dt className="text-xs text-slate-400">Usuário</dt>
              <dd className="font-semibold text-white">{currentUser}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Status</dt>
              <dd className="font-semibold text-emerald-300">Autenticado</dd>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Este é um perfil fictício para avaliação do NEMESIS.
            </p>
          </dl>
        </div>
      </div>
    )}
    </>
  );
}
