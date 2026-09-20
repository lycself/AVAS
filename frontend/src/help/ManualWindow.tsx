import { useEffect, useMemo, useRef, useState } from "react";
import { FloatingWindow, fitRect, viewport, type Rect } from "../components/FloatingWindow";
import { Markdown } from "../components/Markdown";
import { pick, useT, useLang } from "../i18n";
import { call } from "../bridge";
import type { Schema } from "../lattice/types";
import { useManual } from "./store";
import zh from "./manual.zh.md?raw";
import en from "./manual.en.md?raw";
import casesZh from "./cases.zh.md?raw";
import casesEn from "./cases.en.md?raw";
import referenceZh from "./reference.zh.md?raw";
import referenceEn from "./reference.en.md?raw";
import { manualSections, searchManual, type ManualCategory, type ManualSection } from "./content";

const MIN = { width: 340, height: 260 };
function initial(): Rect {
  const v = viewport();
  const width = Math.min(700, v.width * .55);
  return fitRect({ x: v.width - width - 24, y: 60, width, height: v.height - 110 }, MIN);
}
export function ManualLayer() {
  return useManual((s) => s.open) ? <ManualWindow /> : null;
}
function ManualWindow() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const close = useManual((s) => s.close);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ManualCategory>("guide");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const labels = { guide: t("Operation guide"), cases: t("Case tutorials"), reference: t("Parameters and files") };
  const [toc, setToc] = useState(() => initial().width > 480);
  const [schema, setSchema] = useState<Schema | null>(null);
  const [error, setError] = useState("");
  const article = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    call<Schema>("schema.all").then(s => { if (active) setSchema(s); }).catch(e => { if (active) setError(String(e.message ?? e)); });
    return () => { active = false; };
  }, []);
  const sections = useMemo(() => {
    const chinese = lang === "zh_CN";
    const chapters: ManualSection[] = [
      ...manualSections(chinese ? zh : en, "guide"),
      ...manualSections(chinese ? casesZh : casesEn, "cases"),
      ...manualSections(chinese ? referenceZh : referenceEn, "reference"),
    ];
    if (schema) for (const group of ["beam", "input", "lattice"] as const) {
      for (const k of schema[group]) chapters.push({
        category: "reference", id: `${group}-${k.key}`, title: `${group} · ${k.key} — ${pick(k.title)}`,
        text: [pick(k.doc), ...k.params.map((p, i) => `### ${i + 1}. ${pick(p.label)}${p.unit ? ` (${p.unit})` : ""}\n\n${pick(p.doc)}\n\n${p.choices.map(([v, label]) => `- ${v}: ${pick(label)}`).join("\n")}`)].join("\n\n"),
      });
    }
    return chapters;
  }, [lang, schema]);
  const filtered = searchManual(sections, category, query);
  function jump(id: string) {
    const target = sections.find(s => s.id === id);
    if (!target) return;
    setCategory(target.category);
    setQuery("");
    setPendingId(id);
  }
  useEffect(() => {
    if (pendingId) {
      const el = document.getElementById(`manual-${pendingId}`);
      if (el && article.current) { article.current.scrollTop = el.offsetTop; setPendingId(null); }
    }
  }, [pendingId, category, query, schema]);
  function selectCategory(next: ManualCategory) {
    setCategory(next); setQuery(""); setPendingId(null); article.current?.scrollTo(0, 0);
  }
  return <FloatingWindow label={t("User manual")} title={t("User manual")} initialRect={initial} minSize={MIN} onClose={close}
    onKeyDown={(e, root) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") { e.preventDefault(); root?.querySelector("input")?.focus(); } }}>
    <div className="manual-tabs" role="tablist" aria-label={t("Manual categories")}>
      {(["guide", "cases", "reference"] as const).map(key => <button key={key} role="tab" aria-selected={category === key} className="btn btn-small" onClick={() => selectCategory(key)}>{labels[key]}</button>)}
    </div>
    <div className="manual-tools">
      <button className="btn btn-small" aria-expanded={toc} onClick={() => setToc(!toc)}>{t("Contents")}</button>
      <input className="input" aria-label={t("Search manual")} placeholder={t("Search manual")} value={query} onChange={e => { setQuery(e.target.value); article.current?.scrollTo(0, 0); }} />
    </div>
    <div className="manual-body">
      {toc && <nav aria-label={t("Contents")}>{filtered.map(s => <button key={s.id} onClick={() => jump(s.id)}>{query.trim() && <small>{labels[s.category]} · </small>}{s.title}</button>)}</nav>}
      <article ref={article} className="selectable" onClick={e => {
        const link = (e.target as HTMLElement).closest("a");
        const href = link?.getAttribute("href");
        if (href?.startsWith("#")) { e.preventDefault(); jump(href.slice(1)); }
      }}>
        {!filtered.length && <p>{t("Nothing matches.")}</p>}
        {filtered.map(s => <section id={`manual-${s.id}`} key={s.id}><h2>{s.title}</h2>{query.trim() && <p className="muted">{labels[s.category]}</p>}<Markdown text={s.text} /></section>)}
        {!schema && (category === "reference" || query.trim()) && <p role="status">{error ? `${t("Unable to load parameter reference")}: ${error}` : t("Loading parameter reference...")}</p>}
      </article>
    </div>
  </FloatingWindow>;
}
