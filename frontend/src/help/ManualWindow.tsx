import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
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

type Rect = { x: number; y: number; width: number; height: number };
function viewport() {
  const zoom = Number(getComputedStyle(document.documentElement).zoom) || 1;
  return { width: window.innerWidth / zoom, height: window.innerHeight / zoom, zoom };
}
function fit(r: Rect): Rect {
  const v = viewport();
  const width = Math.min(v.width, Math.max(Math.min(340, v.width), r.width));
  const height = Math.min(v.height, Math.max(Math.min(260, v.height), r.height));
  return { width, height, x: Math.max(0, Math.min(r.x, v.width - width)), y: Math.max(0, Math.min(r.y, v.height - height)) };
}
function initial(): Rect {
  const v = viewport();
  const width = Math.min(700, v.width * .55);
  return fit({ x: v.width - width - 24, y: 60, width, height: v.height - 110 });
}
export function ManualLayer() {
  return useManual((s) => s.open) ? <ManualWindow /> : null;
}
function ManualWindow() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const close = useManual((s) => s.close);
  const [rect, setRect] = useState(initial);
  const [maximized, setMaximized] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ManualCategory>("guide");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const labels = { guide: t("Operation guide"), cases: t("Case tutorials"), reference: t("Parameters and files") };
  const [toc, setToc] = useState(() => initial().width > 480);
  const [schema, setSchema] = useState<Schema | null>(null);
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const article = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number; rect: Rect; edge: string } | null>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    root.current?.focus();
    let active = true;
    call<Schema>("schema.all").then(s => { if (active) setSchema(s); }).catch(e => { if (active) setError(String(e.message ?? e)); });
    const resize = () => setRect(r => fit(r));
    window.addEventListener("resize", resize);
    const observer = new MutationObserver(resize);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    return () => { active = false; observer.disconnect(); window.removeEventListener("resize", resize); if (root.current?.contains(document.activeElement) || document.activeElement === document.body) previous?.focus(); };
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
  function start(e: PointerEvent<HTMLElement>, edge = "") {
    if (e.button !== 0 || maximized || (e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { x: e.clientX, y: e.clientY, rect, edge };
  }
  function move(e: PointerEvent<HTMLElement>) {
    const g = gesture.current;
    if (!g) return;
    const dx = (e.clientX - g.x) / viewport().zoom, dy = (e.clientY - g.y) / viewport().zoom;
    const r = { ...g.rect };
    if (!g.edge) { r.x += dx; r.y += dy; }
    else {
      if (g.edge.includes("e")) r.width += dx;
      if (g.edge.includes("s")) r.height += dy;
      if (g.edge.includes("w")) { r.x += dx; r.width -= dx; }
      if (g.edge.includes("n")) { r.y += dy; r.height -= dy; }
    }
    setRect(fit(r));
  }
  const drag = { onPointerMove: move, onPointerUp: () => { gesture.current = null; }, onPointerCancel: () => { gesture.current = null; }, onLostPointerCapture: () => { gesture.current = null; } };
  return <div ref={root} role="dialog" aria-modal="false" aria-label={t("User manual")} tabIndex={-1}
    className="manual-window" style={maximized ? { inset: 0 } : { left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
    onKeyDown={e => { e.stopPropagation(); if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") { e.preventDefault(); root.current?.querySelector("input")?.focus(); } if (e.key === "Escape") { e.preventDefault(); close(); } }}>
    <header className="manual-title" onPointerDown={e => start(e)} {...drag}>
      <strong>{t("User manual")}</strong>
      <button className="btn btn-small" onClick={() => setMaximized(!maximized)}>{maximized ? t("Restore window") : t("Maximize window")}</button>
      <button className="btn btn-small" onClick={close}>{t("Close")}</button>
    </header>
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
    {!maximized && ["n", "s", "e", "w", "ne", "nw", "se", "sw"].map(edge => <div key={edge} className={`manual-resize manual-${edge}`} onPointerDown={e => start(e, edge)} {...drag} />)}
  </div>;
}
