import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { logout, getCurrentUser } from "../utils/auth"; // clears localStorage
import { useTranslation } from "../context/LanguageContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const currentUser = getCurrentUser() || t("nav.user");

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
              {t("nav.session")}
            </div>
            <button
              onClick={() => {
                setMenuOpen(false);
                setShowProfile(true);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition"
            >
              {t("nav.profile")}
            </button>
            <a
              href="http://eic.cefet-rj.br/nemesis/"
              target="_blank"
              rel="noreferrer"
              className="block w-full px-4 py-2 text-sm hover:bg-white/10 transition"
              onClick={() => setMenuOpen(false)}
            >
              {t("nav.help")}
            </a>
            <div className="px-4 py-2 text-xs uppercase tracking-wide text-slate-400">
              {t("nav.menuLanguage")}
            </div>
            <div className="flex items-center gap-2 px-4 pb-2">
              <button
                type="button"
                className={`flex-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  language === "en" ? "bg-white/20 text-white" : "bg-white/5 text-slate-200"
                }`}
                onClick={() => setLanguage("en")}
              >
                {t("common.languageEnglish")}
              </button>
              <button
                type="button"
                className={`flex-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  language === "pt" ? "bg-white/20 text-white" : "bg-white/5 text-slate-200"
                }`}
                onClick={() => setLanguage("pt")}
              >
                {t("common.languagePortuguese")}
              </button>
            </div>
            <div className="my-1 border-t border-white/10" />
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-rose-200 hover:bg-white/10 transition"
            >
              {t("nav.logout")}
            </button>
          </div>
        )}
      </div>
    </nav>

    {showProfile && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{t("nav.profile")}</h3>
            <button
              onClick={() => setShowProfile(false)}
              className="rounded-full border border-white/20 px-3 py-1 text-sm text-slate-200 hover:border-white/40"
            >
              {t("common.close")}
            </button>
          </div>
          <dl className="space-y-3 text-sm text-slate-200">
            <div>
              <dt className="text-xs text-slate-400">{t("nav.user")}</dt>
              <dd className="font-semibold text-white">{currentUser}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">{t("nav.status")}</dt>
              <dd className="font-semibold text-emerald-300">{t("nav.authenticated")}</dd>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {t("nav.profileNote")}
            </p>
          </dl>
        </div>
      </div>
    )}
    </>
  );
}
