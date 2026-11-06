// LaTeX → MathML with temml, for the assistant's answers and the manual.
// temml is loaded on first use (it is a large module); until then a formula shows
// as its source.  The MathML comes from temml's own serializer with `trust: false`
// (no \href, \html…, no attributes from the input), so inserting it is safe even
// for text written by a model; formulas that do not parse stay as code.
import { useSyncExternalStore } from "react";
/** LaTeX macros available to the assistant's answers. */
const MACROS: Record<string, string> = {
  "\\dd": "\\mathrm{d}",
  "\\ee": "\\mathrm{e}",
  "\\tp": "^{\\mathsf{T}}",
  "\\Tr": "\\operatorname{Tr}",
  "\\Brho": "B\\rho",
};

type Temml = typeof import("temml").default;
let temml: Temml | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const cache = new Map<string, string | null>();

function load() {
  loading ??= import("temml").then((m) => {
    temml = m.default;
    for (const fn of listeners) fn();
  });
  return loading;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  load().catch(() => undefined);
  return () => listeners.delete(fn);
}

/** MathML for *tex*, or null when it does not parse (or temml is not loaded yet). */
export function mathml(tex: string, display: boolean): string | null {
  if (!temml) return null;
  const key = `${display ? "D" : "I"}${tex}`;
  let out = cache.get(key);
  if (out === undefined) {
    try {
      out = temml.renderToString(tex, { displayMode: display, throwOnError: true, trust: false, annotate: true, macros: { ...MACROS } });
    } catch {
      out = null;
    }
    if (cache.size > 4000) cache.clear();
    cache.set(key, out);
  }
  return out;
}

export function MathView({ tex, display }: { tex: string; display?: boolean }) {
  const ready = useSyncExternalStore(subscribe, () => temml !== null);
  const html = ready ? mathml(tex, !!display) : null;
  if (html == null) {
    return display ? <pre className="md-code md-math-block"><code>{tex}</code></pre> : <code className="md-math">{tex}</code>;
  }
  const Tag = display ? "div" : "span";
  return <Tag className={display ? "math-display" : "math-inline"} dangerouslySetInnerHTML={{ __html: html }} />;
}
