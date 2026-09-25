/**
 * Languages the card can be written in. Independent of the language printed
 * on the machine: a Japanese remote can get an English or a Vietnamese card.
 */
export const CARD_LANGUAGES = [
  { code: "en", name: "English", english: "English" },
  { code: "vi", name: "Tiếng Việt", english: "Vietnamese" },
  { code: "es", name: "Español", english: "Spanish" },
  { code: "fr", name: "Français", english: "French" },
  { code: "de", name: "Deutsch", english: "German" },
  { code: "pt", name: "Português", english: "Portuguese" },
  { code: "zh", name: "中文", english: "Simplified Chinese" },
  { code: "ja", name: "日本語", english: "Japanese" },
  { code: "ko", name: "한국어", english: "Korean" },
  { code: "hi", name: "हिन्दी", english: "Hindi" },
] as const;

export type CardLanguage = (typeof CARD_LANGUAGES)[number]["code"];

export const LANGUAGE_CODES = CARD_LANGUAGES.map((l) => l.code) as [CardLanguage, ...CardLanguage[]];

export function languageName(code: CardLanguage): string {
  return CARD_LANGUAGES.find((l) => l.code === code)?.english ?? "English";
}
