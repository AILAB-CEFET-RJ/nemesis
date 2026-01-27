import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "../../context/LanguageContext";

export const NoPermissionPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-14 text-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/20 text-rose-200">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">{t("auth.noPermissionTitle")}</h1>
          <p className="mt-2 text-sm text-slate-300">{t("auth.noPermissionSubtitle")}</p>
          <Link
            to="/home"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-rose-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-rose-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
          >
            {t("auth.backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
};
