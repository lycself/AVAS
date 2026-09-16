// UI translations.  Source strings are English; zh_CN.json maps them to Chinese
// (converted from the former Qt Linguist file and extended since).
import { create } from "zustand";
import zh from "./zh_CN.json";

export type Language = "en" | "zh_CN";
export const LANGUAGES: Record<Language, string> = { en: "English", zh_CN: "简体中文" };

const dicts: Record<Language, Record<string, string>> = { en: {}, zh_CN: zh as Record<string, string> };

export const useLang = create<{ lang: Language; setLang: (l: Language) => void }>((set) => ({
  lang: "en",
  setLang: (lang) => set({ lang }),
}));

export function isZh(): boolean {
  return useLang.getState().lang === "zh_CN";
}

/** Translate *source*; ``{name}`` placeholders are filled from *args*. */
export function t(source: string, args?: Record<string, string | number>): string {
  const lang = useLang.getState().lang;
  let text = dicts[lang][source] ?? source;
  if (args) for (const [k, v] of Object.entries(args)) text = text.split(`{${k}}`).join(String(v));
  return text;
}

/** Pick from a bilingual [english, chinese] pair (domain docs coming from Python). */
export function pick(text: string | [string, string] | null | undefined): string {
  if (text == null) return "";
  if (typeof text === "string") return text;
  return isZh() && text[1] ? text[1] : text[0];
}

/** Re-render the component when the language changes; returns t. */
export function useT(): typeof t {
  useLang((s) => s.lang);
  return t;
}
