import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../utils/auth";

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const validUsers = [
      { username: "admin", password: "admin" },
      { username: "avaliador", password: "nemesisSOF2025" },
    ];

    const credOk = validUsers.some(
      (u) => u.username === username && u.password === password
    );

    if (!credOk) {
      setError("Usuário ou senha inválidos");
      return;
    }

    login(); // saves in localStorage
    navigate("/home"); // redirect home
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.25),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(56,189,248,0.25),_transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-14">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-rose-200 text-center">
            acesso seguro
          </p>
          <h1 className="mt-3 text-center text-3xl font-semibold text-white">Entrar no NEMESIS</h1>
          <p className="mt-2 text-center text-sm text-slate-300">
            Use suas credenciais para continuar a análise.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="text-sm text-slate-200">Usuário</label>
              <input
                type="text"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-rose-300 focus:bg-slate-900/80"
              />
            </div>
            <div>
              <label className="text-sm text-slate-200">Senha</label>
              <input
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-rose-300 focus:bg-slate-900/80"
              />
            </div>
            {error && (
              <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="mt-2 w-full rounded-full bg-rose-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-rose-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
