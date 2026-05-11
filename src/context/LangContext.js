// src/context/LangContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import T from "../i18n/translations";

const Ctx = createContext();
export const useLang = () => useContext(Ctx);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("emrs_lang") || "en";
    } catch { return "en"; }
  });

  useEffect(() => {
    try { localStorage.setItem("emrs_lang", lang); } catch {}
    document.documentElement.dir  = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.body.style.fontFamily = lang === "ar"
      ? "'Cairo', 'Inter', sans-serif"
      : "'Inter', sans-serif";
  }, [lang]);

  function toggleLang() {
    setLang(prev => prev === "en" ? "ar" : "en");
  }

  // t() returns the translation for a key
  const t = (key) => (T[lang] && T[lang][key]) || T.en[key] || key;

  const isRTL = lang === "ar";

  return (
    <Ctx.Provider value={{ lang, setLang, toggleLang, t, isRTL }}>
      {children}
    </Ctx.Provider>
  );
}
