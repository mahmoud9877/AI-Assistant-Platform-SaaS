"use client";

import { useTranslation } from "react-i18next";
import { setLanguage } from "@/lib/i18n";

/** Switches between English and Arabic. */
export function useLanguage() {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  return {
    isArabic,
    toggleLanguage: () => setLanguage(isArabic ? "en" : "ar"),
    otherLanguageLabel: isArabic ? "English" : "عربي",
  };
}
