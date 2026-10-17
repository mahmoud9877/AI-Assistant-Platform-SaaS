"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "@/lib/i18n/locales/en";
import { ar } from "@/lib/i18n/locales/ar";

export const LANGUAGES = ["en", "ar"] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = "eve-language";

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  // Always start in English so server and client markup match; the saved
  // choice is applied after mount by restoreLanguage().
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

/** Switches language, flips the page direction, and remembers the choice. */
export function setLanguage(language: Language): void {
  i18n.changeLanguage(language);
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // The choice just won't survive a reload.
  }
}

/** Applies the language saved by setLanguage(), if any. */
export function restoreLanguage(): void {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    return;
  }
  if (saved && (LANGUAGES as readonly string[]).includes(saved) && saved !== i18n.language) {
    setLanguage(saved as Language);
  }
}

export default i18n;
