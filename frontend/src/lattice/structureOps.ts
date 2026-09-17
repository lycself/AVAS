// Structural edits of a lattice document (insert, split a drift, delete,
// duplicate, move) expressed as line-range replacements on the text, so the
// text editor applies them as one undo step.
//
// Superpose blocks follow the manual: every element inside a block has one
// "superpose z0 ..." line before it, z0 is measured from the entrance of the
// block's first element and the first superpose must be all zeros.  Deleting
// the first element of a block therefore re-references the other z0 values
// and puts a drift in front of the block, so no element moves.
import { t } from "../i18n";
import type { LatticeDoc, Statement } from "./types";

/** Replace lines [start, end) by *lines* (insertion when start === end). */
export type RangeEdit = { start: number; end: number; lines: string[] };

export type OpResult = { edits: RangeEdit[]; select?: number; message?: string } | { error: string };

export type NewElementKind =
  | "drift"
  | "quad"
  | "solenoid"
  | "bend"
  | "edge"
  | "steerer"
  | "field_rf"
  | "field_b"
  | "field_e"
  | "diag_size"
  | "diag_energy"
  | "diag_position"
  | "outputplane";

const fmt = (v: number) => String(Number(v.toPrecision(10)));

function num(s: string | undefined, d = 0) {
  const v = Number(s);
  return Number.isFinite(v) ? v : d;
}

export function defaultLength(kind: NewElementKind): number {
  switch (kind) {
    case "drift":
      return 0.1;
    case "quad":
    case "solenoid":
      return 0.1;
    case "field_rf":
    case "field_b":
    case "field_e":
      return 0.2;
    default:
      return 0;
  }
}

/** Text of a new element with sensible defaults. */
export function newElementText(kind: NewElementKind, opts: { length?: number; aperture?: number; frequency?: number; fieldmap?: string } = {}): string {
  const L = fmt(opts.length ?? defaultLength(kind));
  const R = fmt(opts.aperture ?? 0.02);
  const f = opts.frequency ? fmt(opts.frequency) : "162500000.0";
  const fm = opts.fieldmap || "fieldmap";
  switch (kind) {
    case "drift":
      return `drift ${L} ${R} 0`;
    case "quad":
      return `quad ${L} ${R} 0 0`;
    case "solenoid":
      return `solenoid ${L} ${R} 0 0`;
    case "bend":
      return `bend 0 ${R} 0 30 1 0 0`;
    case "edge":
      return `edge 0 ${R} 0 0 1 0.05 0.5 0 0`;
    case "steerer":
      return `steerer 0 ${R} 0 0 0 0 0`;
    case "field_rf":
      return `field ${L} ${R} 0 1 ${f} 0 1 1 ${fm}`;
    case "field_b":
      return `field ${L} ${R} 0 3 0 0 1 1 ${fm}`;
    case "field_e":
      return `field ${L} ${R} 0 2 0 0 1 1 ${fm}`;
    case "diag_size":
      return "diag_size 0 0 0 0";
    case "diag_energy":
      return "diag_energy 0 0 0";
    case "diag_position":
      return "diag_position 0 0 0 0";
    case "outputplane":
      return "outputplane 0";
  }
}

/* ------------------------------------------------------------------ units */
export type Unit = { start: number; end: number; first: Statement; last: Statement; block: number | null; kind: "statement" | "block" };

const FIXED = new Set(["start", "end", "lattice", "lattice_end"]);

function blockStatements(doc: LatticeDoc, block: number): Statement[] {
  return doc.statements.filter((s) => s.block === block);
}

/** The lines that belong to an element inside a superpose block: its superpose line, a "!name" line and itself. */
function blockElementUnit(doc: LatticeDoc, st: Statement): Unit {
  const idx = doc.statements.indexOf(st);
  let start = st.commentNameLine ?? st.line;
  const prev = doc.statements[idx - 1];
  if (prev && prev.block === st.block && prev.key === "superpose") start = Math.min(start, prev.line);
  return { start, end: st.line + 1, first: prev?.key === "superpose" ? prev : st, last: st, block: st.block, kind: "statement" };
}

function wholeBlock(doc: LatticeDoc, block: number): Unit {
  const items = blockStatements(doc, block);
  const first = items[0];
  const last = items[items.length - 1];
  return { start: first.commentNameLine ?? first.line, end: last.line + 1, first, last, block, kind: "block" };
}

/** Top-level movable units in file order: statements outside blocks and whole superpose blocks. */
export function topUnits(doc: LatticeDoc): Unit[] {
  const out: Unit[] = [];
  const seen = new Set<number>();
  for (const st of doc.statements) {
    if (st.block != null) {
      if (!seen.has(st.block)) {
        seen.add(st.block);
        out.push(wholeBlock(doc, st.block));
      }
      continue;
    }
    out.push({ start: st.commentNameLine ?? st.line, end: st.line + 1, first: st, last: st, block: null, kind: "statement" });
  }
  return out;
}

function statementAt(doc: LatticeDoc, line: number) {
  return doc.statements.find((s) => s.line === line) ?? null;
}

function linesOf(text: string[], u: { start: number; end: number }) {
  return text.slice(u.start, u.end);
}

/* ------------------------------------------------------------------ operations */
export function canEditStructure(doc: LatticeDoc, line: number): boolean {
  const st = statementAt(doc, line);
  return !!st && !FIXED.has(st.key);
}

/** Move the unit containing *line* one unit up (-1) or down (+1) among the top-level units. */
export function moveUnit(doc: LatticeDoc, text: string[], line: number, dir: -1 | 1): OpResult {
  const st = statementAt(doc, line);
  if (!st) return { error: t("Nothing selected.") };
  if (FIXED.has(st.key)) return { error: t("'{kw}' lines are not moved here; edit them in the text.", { kw: st.keyword }) };
  const units = topUnits(doc);
  const i = units.findIndex((u) => (st.block != null ? u.block === st.block : u.first.line === st.line));
  const j = i + dir;
  if (i < 0) return { error: t("Nothing selected.") };
  if (j < 0 || j >= units.length || FIXED.has(units[j].first.key)) return { error: t("Already at the edge of the lattice.") };
  const a = dir < 0 ? units[j] : units[i];
  const b = dir < 0 ? units[i] : units[j];
  // a is above b: rewrite [a.start, b.end) as b, (lines between), a
  const between = text.slice(a.end, b.start);
  const lines = [...linesOf(text, b), ...between, ...linesOf(text, a)];
  const moved = dir < 0 ? b : a;
  const offset = dir < 0 ? 0 : b.end - b.start + between.length;
  const select = a.start + offset + (st.line - moved.start);
  return { edits: [{ start: a.start, end: b.end, lines }], select };
}

/** Move the unit at *line* before or after the unit at *target* (drag and drop in the outline). */
export function moveUnitTo(doc: LatticeDoc, text: string[], line: number, target: number, after: boolean): OpResult {
  const st = statementAt(doc, line);
  const tg = statementAt(doc, target);
  if (!st || !tg) return { error: t("Nothing selected.") };
  if (FIXED.has(st.key)) return { error: t("'{kw}' lines are not moved here; edit them in the text.", { kw: st.keyword }) };
  const units = topUnits(doc);
  const find = (s: Statement) => units.find((u) => (s.block != null ? u.block === s.block : u.first.line === s.line));
  const a = find(st);
  const b = find(tg);
  if (!a || !b) return { error: t("Nothing selected.") };
  if (a === b) return { edits: [] };
  if (after && FIXED.has(b.first.key) && b.first.key === "end") return { error: t("Elements after 'end' are not simulated; drop above it.") };
  if (!after && b.first.key === "start") return { error: t("Elements before 'start' are not simulated; drop below it.") };
  const at = after ? b.end : b.start;
  if (at >= a.start && at <= a.end) return { edits: [] };
  const lines = linesOf(text, a);
  const edits: RangeEdit[] = [
    { start: a.start, end: a.end, lines: [] },
    { start: at, end: at, lines },
  ];
  const size = a.end - a.start;
  const newStart = at > a.start ? at - size : at;
  return { edits, select: newStart + (st.line - a.start) };
}

/** Delete the element (or command) at *line*. */
export function deleteUnit(doc: LatticeDoc, _text: string[], line: number): OpResult {
  const st = statementAt(doc, line);
  if (!st) return { error: t("Nothing selected.") };
  if (FIXED.has(st.key)) return { error: t("'{kw}' lines are not deleted here; edit them in the text.", { kw: st.keyword }) };
  if (st.block == null || !st.isElement) {
    if (st.block != null && (st.key === "superpose" || st.key === "superposeend" || st.key === "superposeout")) {
      const u = wholeBlock(doc, st.block);
      return { edits: [{ start: u.start, end: u.end, lines: [] }], message: t("Deleted the whole superpose block.") };
    }
    return { edits: [{ start: st.commentNameLine ?? st.line, end: st.line + 1, lines: [] }] };
  }
  const items = blockStatements(doc, st.block);
  const elements = items.filter((s) => s.isElement);
  if (elements.length <= 1) {
    const u = wholeBlock(doc, st.block);
    return { edits: [{ start: u.start, end: u.end, lines: [] }] };
  }
  const unit = blockElementUnit(doc, st);
  if (elements[0] !== st) return { edits: [{ start: unit.start, end: unit.end, lines: [] }] };
  // first element: re-reference the other superpose lines to the new first one and keep positions with a drift
  const next = elements[1];
  const nextSup = doc.statements[doc.statements.indexOf(next) - 1];
  const shift = num(nextSup?.params[0]);
  const edits: RangeEdit[] = [{ start: unit.start, end: unit.end, lines: shift > 0 ? [`${st.indent}drift ${fmt(shift)} ${st.params[1] ?? "0.02"} 0`] : [] }];
  for (const s of items) {
    if (s.key !== "superpose" || s.line < unit.end) continue;
    const params = [...s.params];
    params[0] = fmt(Math.max(0, num(params[0]) - shift));
    edits.push({ start: s.line, end: s.line + 1, lines: [replaceParams(s, params)] });
  }
  return { edits, message: shift > 0 ? t("Positions kept: a {l} m drift now precedes the block.", { l: fmt(shift) }) : undefined };
}

function replaceParams(st: Statement, params: string[]) {
  const code = (st.prefixName ? `${st.prefixName} : ` : "") + [st.keyword, ...params].join(" ");
  return st.indent + code + (st.comment ? " " + st.comment : "");
}

/** Duplicate the unit at *line* right after itself. */
export function duplicateUnit(doc: LatticeDoc, text: string[], line: number): OpResult {
  const st = statementAt(doc, line);
  if (!st) return { error: t("Nothing selected.") };
  if (FIXED.has(st.key)) return { error: t("'{kw}' lines cannot be duplicated.", { kw: st.keyword }) };
  let unit: Unit;
  if (st.block != null && st.isElement) unit = blockElementUnit(doc, st);
  else if (st.block != null) unit = wholeBlock(doc, st.block);
  else unit = { start: st.commentNameLine ?? st.line, end: st.line + 1, first: st, last: st, block: null, kind: "statement" };
  const copy = linesOf(text, unit).map((l) => renameCopy(l));
  return { edits: [{ start: unit.end, end: unit.end, lines: copy }], select: unit.end + (st.line - unit.start) };
}

function renameCopy(line: string) {
  // "name : keyword ..." and "!name X" get a _copy suffix so names stay unique
  const m = line.match(/^(\s*)([^\s!:]+)(\s*:\s*)(.*)$/);
  if (m && !/^\s*!/.test(line)) return `${m[1]}${m[2]}_copy${m[3]}${m[4]}`;
  const c = line.match(/^(\s*!\s*name\s+)(\S+)(.*)$/i);
  if (c) return `${c[1]}${c[2]}_copy${c[3]}`;
  return line;
}

/** Insert a new element right after the unit at *line*. */
export function insertAfter(doc: LatticeDoc, _text: string[], line: number, elementText: string): OpResult {
  const st = statementAt(doc, line);
  if (!st) return { error: t("Nothing selected.") };
  if (st.key === "end") return insertBefore(doc, line, elementText);
  let at: number;
  let indent = st.indent;
  if (st.block != null) at = wholeBlock(doc, st.block).end;
  else at = st.line + 1;
  if (st.block != null) indent = doc.statements.find((s) => s.line === wholeBlock(doc, st.block!).first.line)?.indent ?? "";
  return { edits: [{ start: at, end: at, lines: [indent + elementText] }], select: at };
}

function insertBefore(doc: LatticeDoc, line: number, elementText: string): OpResult {
  const st = statementAt(doc, line)!;
  const at = st.commentNameLine ?? st.line;
  return { edits: [{ start: at, end: at, lines: [st.indent + elementText] }], select: at };
}

/**
 * Insert a new element at position *z* (m).  Inside a drift the drift is split so
 * that everything downstream keeps its position; inside a superpose block the
 * element is superposed at that z; elsewhere it goes before/after the nearest unit.
 */
export function insertAtZ(doc: LatticeDoc, _text: string[], z: number, elementText: string, length: number): OpResult {
  const active = doc.statements.filter((s) => s.active);
  const start = active.find((s) => s.key === "start");
  const end = active.find((s) => s.key === "end");
  const units = topUnits(doc).filter((u) => u.first.active || u.last.active);
  const elementsUnits = units.filter((u) => u.kind === "block" || u.first.isElement);
  if (!elementsUnits.length) {
    const at = end ? end.line : start ? start.line + 1 : doc.statements.length ? doc.statements[doc.statements.length - 1].line + 1 : 0;
    return { edits: [{ start: at, end: at, lines: [elementText] }], select: at };
  }
  for (const u of elementsUnits) {
    const z0 = u.kind === "block" ? blockStart(doc, u.block!) : u.first.zStart ?? 0;
    const z1 = u.kind === "block" ? blockEnd(doc, u.block!) : u.first.zEnd ?? z0;
    if (z < z0 - 1e-12 || z > z1 + 1e-12) continue;
    if (u.kind === "block") {
      const closing = u.last;
      const z0rel = Math.max(0, z - z0);
      const first = blockStatements(doc, u.block!)[0];
      const lines = [`${first.indent}superpose ${fmt(z0rel)} 0 0 0 0 0`, `${first.indent}${elementText}`];
      return { edits: [{ start: closing.line, end: closing.line, lines }], select: closing.line + 1, message: t("Superposed at z0 = {v} m in the block.", { v: fmt(z0rel) }) };
    }
    const st = u.first;
    if (st.key === "drift") {
      const L = num(st.params[0]);
      const a = z - (st.zStart ?? 0);
      const rest = L - a - length;
      const R = st.params[1] ?? "0.02";
      if (rest >= -1e-9) {
        const lines: string[] = [];
        if (a > 1e-12) lines.push(replaceParams(st, [fmt(a), R, ...st.params.slice(2)]));
        lines.push(st.indent + elementText);
        if (rest > 1e-12) lines.push(`${st.indent}drift ${fmt(rest)} ${R} ${st.params[2] ?? "0"}`);
        const select = st.line + (a > 1e-12 ? 1 : 0);
        return { edits: [{ start: st.line, end: st.line + 1, lines }], select, message: t("Split the drift: downstream positions are unchanged.") };
      }
      return {
        edits: [{ start: st.line + 1, end: st.line + 1, lines: [st.indent + elementText] }],
        select: st.line + 1,
        message: t("The drift is shorter than the new element; inserted after it (downstream elements move by {l} m).", { l: fmt(length) }),
      };
    }
    const mid = ((st.zStart ?? 0) + (st.zEnd ?? 0)) / 2;
    const at = z < mid ? u.start : u.end;
    return { edits: [{ start: at, end: at, lines: [st.indent + elementText] }], select: at };
  }
  // outside every element: before the first or after the last one
  const firstU = elementsUnits[0];
  const lastU = elementsUnits[elementsUnits.length - 1];
  const at = z <= (firstU.first.zStart ?? 0) ? firstU.start : lastU.end;
  return { edits: [{ start: at, end: at, lines: [firstU.first.indent + elementText] }], select: at };
}

export function blockStart(doc: LatticeDoc, block: number) {
  const items = blockStatements(doc, block);
  return items[0]?.zStart ?? 0;
}

export function blockEnd(doc: LatticeDoc, block: number) {
  const items = blockStatements(doc, block);
  return Math.max(...items.map((s) => s.zEnd ?? s.zStart ?? 0));
}

/** Where a drop at *z* would go, for the insertion marker (z of the marker). */
export function dropMarker(doc: LatticeDoc, z: number): { z: number; kind: "split" | "superpose" | "between" } {
  for (const u of topUnits(doc)) {
    if (u.kind === "block") {
      const z0 = blockStart(doc, u.block!);
      const z1 = blockEnd(doc, u.block!);
      if (z >= z0 && z <= z1 && u.first.active) return { z, kind: "superpose" };
      continue;
    }
    const st = u.first;
    if (!st.active || !st.isElement || st.zStart == null || st.zEnd == null) continue;
    if (z >= st.zStart && z <= st.zEnd) {
      if (st.key === "drift") return { z, kind: "split" };
      return { z: z < (st.zStart + st.zEnd) / 2 ? st.zStart : st.zEnd, kind: "between" };
    }
  }
  return { z, kind: "between" };
}
