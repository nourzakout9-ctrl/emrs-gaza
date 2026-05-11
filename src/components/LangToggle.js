// src/components/LangToggle.js
import React from "react";
import { useLang } from "../context/LangContext";

export default function LangToggle({ light = false }) {
  const { lang, toggleLang } = useLang();
  return (
    <button
      className={`lang-toggle${light ? " lang-toggle-light" : ""}`}
      onClick={toggleLang}
      title={lang === "en" ? "العربية" : "English"}
    >
      <span className="lang-toggle-globe">🌐</span>
      {lang === "en" ? "العربية" : "English"}
    </button>
  );
}
