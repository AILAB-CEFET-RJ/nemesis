import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "../i18n/en.json";
import pt from "../i18n/pt.json";

type Language = "en" | "pt";

type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string, params?: Record<string, string | number>) => string;
}

const resources: Record<Language, Translations> = { en, pt };

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key, fallback) => fallback ?? key,
});

function resolveKey(path: string, lang: Language): string | undefined {
  const segments = path.split(".");
  let current: any = resources[lang];
  for (const segment of segments) {
    if (current && typeof current === "object" && segment in current) {
      current = current[segment];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

function applyParams(value: string, params?: Record<string, string | number>) {
  if (!params) return value;
  return Object.entries(params).reduce((acc, [key, val]) => acc.replace(`{{${key}}}`, String(val)), value);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem("nemesis_language") as Language | null;
    if (stored === "en" || stored === "pt") {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("nemesis_language", lang);
  };

  const t = (key: string, fallback?: string, params?: Record<string, string | number>) => {
    const value = resolveKey(key, language) ?? resolveKey(key, "en") ?? resolveKey(key, "pt");
    const finalValue = value ?? fallback ?? key;
    return applyParams(finalValue, params);
  };

  const value = useMemo(() => ({ language, setLanguage, t }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useTranslation = () => useContext(LanguageContext);
