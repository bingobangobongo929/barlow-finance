export const locales = ["en", "da"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  da: "Dansk",
};

export const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  da: "🇩🇰",
};
