import { createContext, createElement, useCallback, useContext, useMemo } from "react";
import { translations } from "./translations";

export function normalizeLanguage(value) {
  return value === "es" ? "es" : "en";
}

function lookup(dict, key) {
  return key.split(".").reduce((node, part) => node?.[part], dict);
}

export function translate(language, key, vars = {}) {
  const lang = normalizeLanguage(language);
  let text =
    lookup(translations[lang], key) ?? lookup(translations.en, key) ?? key;

  if (typeof text !== "string") {
    return key;
  }

  Object.entries(vars).forEach(([name, value]) => {
    text = text.replaceAll(`{${name}}`, String(value));
  });

  return text;
}

export function translateSubjectName(language, name) {
  if (!name) {
    return name;
  }

  const mapped = lookup(
    translations[normalizeLanguage(language)],
    `subjectsMap.${name}`,
  );
  return typeof mapped === "string" ? mapped : name;
}

const LanguageContext = createContext("en");

export function LanguageProvider({ language, children }) {
  const value = normalizeLanguage(language);
  return createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useT() {
  const language = useLanguage();
  return useCallback(
    (key, vars) => translate(language, key, vars),
    [language],
  );
}

export function useI18n() {
  const language = useLanguage();
  const t = useT();
  const locale = language === "es" ? "es" : "en-US";

  return useMemo(
    () => ({
      language,
      t,
      locale,
      subjectName: (name) => translateSubjectName(language, name),
    }),
    [language, t, locale],
  );
}
