import { pick, t } from "../i18n";
import zh from "../i18n/zh_CN.json";
import { fieldMapShape } from "./glyphs";
import type { Bi, Keyword, Statement } from "./types";

const MAGNET_KEYS: Record<string, string> = { solenoid: "solenoid", quad: "quad", dipole: "bend", steerer: "steerer" };

/** Presentation only: field-map magnet names are hints, not physical metadata. */
export function elementType(st: Statement, kw: Map<string, Keyword>) {
  const spec = kw.get(st.key);
  const fallback: Bi = spec?.title ?? [st.keyword, st.keyword];
  let title = fallback;
  let inferred = false;
  if (st.key === "field") {
    title = spec?.params.find((p) => p.key === "type")?.choices.find(([value]) => value === st.fieldType)?.[1] ?? fallback;
    if (st.fieldType === "1") title = ["RF cavity", zh["RF cavity"]];
    if (st.fieldType === "3") {
      const key = MAGNET_KEYS[fieldMapShape(st.params[8] ?? "")];
      const magnet = key ? kw.get(key) : undefined;
      if (magnet) {
        title = magnet.title;
        inferred = true;
      }
    }
  }
  const label = inferred ? t("{type} (inferred)", { type: pick(title) }) : pick(title);
  return { label, inferred, search: [...fallback, ...title, label].join(" ") };
}

export function matchesStatement(st: Statement, kw: Map<string, Keyword>, query: string): boolean {
  return [st.name, st.keyword, ...st.params, elementType(st, kw).search]
    .join(" ").toLowerCase().includes(query.trim().toLowerCase());
}
