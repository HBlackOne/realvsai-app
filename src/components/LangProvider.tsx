"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "ar";

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  isRtl: boolean;
};

const LangContext = createContext<LangContextValue | null>(null);

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem("realvsai.lang");
  if (saved === "en" || saved === "ar") return saved;
  const nav = (navigator.language || "en").toLowerCase();
  return nav.startsWith("ar") ? "ar" : "en";
}

export default function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(getInitialLang());
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { window.localStorage.setItem("realvsai.lang", l); } catch {}
  };

  const value = useMemo(() => ({ lang, setLang, isRtl: lang === "ar" }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
