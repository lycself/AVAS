// Lattice document as returned by lattice.parse (avas/gui/services/lattice.py).
import { call } from "../bridge";
import { fmtG } from "../format";
import { pick } from "../i18n";

export type Bi = [string, string];
export type Issue = { level: "error" | "warning"; text: Bi };

export type Statement = {
  line: number;
  raw: string;
  indent: string;
  keyword: string;
  key: string;
  name: string;
  prefixName: string;
  commentName: string;
  commentNameLine: number | null;
  params: string[];
  comment: string;
  active: boolean;
  zStart: number | null;
  zEnd: number | null;
  length: number;
  block: number | null;
  category: string;
  isElement: boolean;
  known: boolean;
  fieldType: string;
  issues: Issue[];
  fieldmap?: { found: string[]; missing: string };
};

export type GroupNode = { title: string; kind: string; line: number | null; children: (GroupNode | { s: number })[] };

export type LatticeDoc = {
  statements: Statement[];
  root: GroupNode;
  issues: Issue[];
  totalLength: number;
  elementCount: number;
  rfCount: number;
  issueCount: number;
};

export type Param = { key: string; label: Bi; unit: string; kind: string; doc: Bi; choices: [string, Bi][] };
export type Keyword = { key: string; title: Bi; category: string; doc: Bi; minParams: number; params: Param[] };
export type Schema = {
  lattice: Keyword[];
  beam: Keyword[];
  input: Keyword[];
  elementCategories: string[];
  ini: { section: string; key: string; meaning: Bi }[];
  separticle: { label: Bi; unit: string }[];
  tracewinParams: Record<string, [string, string][]>;
  tracewinWords: string[];
  extMeaning: Record<string, Bi>;
};

let schemaPromise: Promise<Schema> | null = null;
let schemaCache: Schema | null = null;
export function loadSchema(): Promise<Schema> {
  if (!schemaPromise) schemaPromise = call<Schema>("schema.all").then((s) => (schemaCache = s));
  return schemaPromise;
}
export function schemaNow(): Schema | null {
  return schemaCache;
}

export function keywordMap(list: Keyword[]): Map<string, Keyword> {
  return new Map(list.map((k) => [k.key, k]));
}

export function choiceValue(p: Param, value: string): string | null {
  for (const [v] of p.choices) if (v.toLowerCase() === String(value).toLowerCase()) return v;
  const n = Number(value);
  if (String(value).trim() === "" || !Number.isFinite(n)) return null;
  for (const [v] of p.choices) if (Number.isFinite(Number(v)) && Number(v) === n) return v;
  return null;
}

export function choiceLabel(p: Param, value: string): Bi | null {
  const v = choiceValue(p, value);
  if (v === null) return null;
  return p.choices.find(([c]) => c === v)?.[1] ?? null;
}

export function worstIssue(st: Statement): "error" | "warning" | null {
  if (st.issues.some((i) => i.level === "error")) return "error";
  return st.issues.length ? "warning" : null;
}

/* ------------------------------------------------------------------ editing helpers (port of lattice_doc.py) */
export function formatStatement(st: Statement, opts: { keyword?: string; params?: string[]; name?: string; comment?: string } = {}): string {
  const keyword = opts.keyword ?? st.keyword;
  let params = [...(opts.params ?? st.params)];
  while (params.length && params[params.length - 1] === "") params.pop();
  params = params.map((p) => (p !== "" ? p : "0"));
  let prefixName = opts.name ?? st.prefixName;
  if (opts.name !== undefined && st.commentName && !st.prefixName) prefixName = "";
  let comment = opts.comment ?? st.comment;
  if (comment && !comment.startsWith("!")) comment = "! " + comment;
  const code = (prefixName ? `${prefixName} : ` : "") + [keyword, ...params].join(" ");
  return st.indent + code + (comment ? " " + comment : "");
}

export type Edit = [number, string];

export function renameEdits(st: Statement, newName: string): Edit[] {
  const name = newName.trim().replace(/ /g, "_");
  if (st.commentName && !st.prefixName && st.commentNameLine !== null) {
    if (!name) return [[st.commentNameLine, ""]];
    return [[st.commentNameLine, `${st.indent}!name ${name}`]];
  }
  return [[st.line, formatStatement(st, { name })]];
}

const g = (v: number) => fmtG(v, 6);

export function statementSummary(st: Statement, kw: Keyword | undefined): string {
  const p = (k: number) => st.params[k] ?? "";
  const key = st.key;
  if (key === "field" && kw) {
    const kind = choiceLabel(kw.params[3], p(3));
    const parts = [kind ? pick(kind) : `type ${p(3)}`];
    if (p(8)) parts.push(p(8));
    if (st.fieldType === "1") {
      parts.push(`${g((Number(p(4)) || 0) / 1e6)} MHz`);
      parts.push(`φ=${p(5)}°`);
    }
    return parts.join(" · ");
  }
  if (key === "drift") return `L=${p(0)} m`;
  if (key === "quad") return `L=${p(0)} m · G=${p(3)} T/m`;
  if (key === "solenoid") return `L=${p(0)} m · B=${p(3)} T`;
  if (key === "bend") return `α=${p(3)}° · ρ=${p(4)} m`;
  if (key === "steerer") return `Bx/Ex=${p(3)} · By/Ey=${p(4)}`;
  if ((key === "superpose" || key === "superposeout") && st.params.length) return `z0=${p(0)} m`;
  if (kw && kw.category === "error" && st.params.length >= 2 && kw.params[1]?.key === "r") {
    const label = choiceLabel(kw.params[1], p(1));
    return `N=${p(0)} · ${label ? pick(label) : p(1)}`;
  }
  return st.params.join(" ");
}

/** CSS variable of the schematic colour of an element. */
export function elementColorVar(st: Statement): string {
  if (st.key === "field") return ({ "1": "--el-rf", "2": "--el-efield", "3": "--el-bmag" } as Record<string, string>)[st.fieldType] ?? "--el-other";
  const map: Record<string, string> = { drift: "--el-drift", quad: "--el-quad", solenoid: "--el-solenoid", bend: "--el-bend", edge: "--el-bend", steerer: "--el-steerer" };
  return map[st.key] ?? (st.category === "diag" ? "--el-diag" : "--el-other");
}

/** Display value with 6 significant digits (read-outs, tooltips; never written back to a file). */
export const fmt6 = (v: number | null | undefined): string => fmtG(v, 6);
