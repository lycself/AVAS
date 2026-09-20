// Physical-parameter view of a lattice document: tree + property form, and
// a parameter table per keyword.  Every edit is a whole-line replacement
// sent to the text editor (one undo step).
import { useEffect, useMemo, useRef, useState } from "react";
import { openMenu, promptDialog } from "../components/overlays";
import { applyResult, structureMenu, type ApplyRange } from "./structureMenu";
import { deleteUnit, duplicateUnit, moveUnit, moveUnitTo } from "./structureOps";
import { Checkbox, CommitInput, cx, Icon, Select, Tabs } from "../components/ui";
import { pick, t, useT } from "../i18n";
import { ComponentView } from "./ComponentView";
import { Beamline } from "./Beamline";
import { elementType, matchesStatement } from "./elementType";
import { selectedGroups } from "./treeSelection";
import {
  choiceLabel,
  choiceValue,
  elementColorVar,
  fmt6,
  formatStatement,
  renameEdits,
  statementSummary,
  worstIssue,
  type Edit,
  type GroupNode,
  type Keyword,
  type LatticeDoc,
  type Param,
  type Schema,
  type Statement,
} from "./types";

type Props = {
  doc: LatticeDoc | null;
  schema: Schema;
  selected: number | null;
  selectionRequest?: number;
  onSelect: (line: number, source: "tree" | "beamline" | "grid") => void;
  onEdits: (edits: Edit[]) => void;
  /** Structural edits (insert / move / delete); absent = no structure menu. */
  onRangeEdits?: ApplyRange;
  getLines?: () => string[];
  frequency?: number;
  readOnly?: boolean;
  fieldmaps: Record<string, string[]>;
  fieldDirs?: string[];
  /** The last parse failed with this message; *doc* is the previous good one. */
  parseError?: string | null;
};

/** Tree props for structural editing (context menu, drag and drop, keys) shared with the visual editor. */
export function structureTreeHandlers(doc: LatticeDoc, getLines: () => string[], apply: ApplyRange, opts: { readOnly?: boolean; frequency?: number; onShowText?: (line: number) => void }) {
  if (opts.readOnly) return {};
  return {
    onContextMenu: (line: number, e: React.MouseEvent) =>
      openMenu(structureMenu(doc, getLines, line, apply, { frequency: opts.frequency, onShowText: opts.onShowText ? () => opts.onShowText!(line) : undefined }), e.clientX, e.clientY),
    onMoveTo: (line: number, target: number, after: boolean) => applyResult(moveUnitTo(doc, getLines(), line, target, after), apply),
    onKeyCommand: (cmd: "delete" | "up" | "down" | "duplicate", line: number) => {
      const lines = getLines();
      const result =
        cmd === "delete" ? deleteUnit(doc, lines, line) : cmd === "duplicate" ? duplicateUnit(doc, lines, line) : moveUnit(doc, lines, line, cmd === "up" ? -1 : 1);
      applyResult(result, apply);
    },
  };
}

const FLOAT_RE = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;
const INT_RE = /^[-+]?\d+$/;

function IssueIcon({ st }: { st: Statement }) {
  const w = worstIssue(st);
  if (!w) return null;
  return <Icon name={w} className={w === "error" ? "danger-text" : "warning-text"} title={st.issues.map((i) => pick(i.text)).join("\n")} />;
}

function Swatch({ st }: { st: Statement }) {
  if (!st.isElement) return <span className="swatch-empty" />;
  return <span className="swatch" style={{ background: `var(${elementColorVar(st)})` }} />;
}

/* ------------------------------------------------------------------ tree */
type Filter = "all" | "elements" | "commands" | "issues";

export function StructureTree({
  doc,
  kw,
  selected,
  onSelect,
  onContextMenu,
  onMoveTo,
  onKeyCommand,
  compact,
  revealRequest = 0,
}: {
  doc: LatticeDoc;
  kw: Map<string, Keyword>;
  selected: number | null;
  onSelect: (line: number) => void;
  onContextMenu?: (line: number, e: React.MouseEvent) => void;
  /** Drag and drop reordering: move the unit at *line* before / after *target*. */
  onMoveTo?: (line: number, target: number, after: boolean) => void;
  /** Keyboard shortcuts on the selected row (Delete, Alt+Up/Down, Ctrl+D). */
  onKeyCommand?: (cmd: "delete" | "up" | "down" | "duplicate", line: number) => void;
  compact?: boolean;
  /** Increment on diagram clicks, including a second click on the same element. */
  revealRequest?: number;
}) {
  const tt = useT();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [dropAt, setDropAt] = useState<{ line: number; after: boolean } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected === null) return;
    const st = doc.statements.find((s) => s.line === selected);
    if (!st) return;
    setCollapsed((prev) => {
      const keys = selectedGroups(doc, selected);
      if (!keys.some((key) => prev[key] !== false)) return prev;
      return { ...prev, ...Object.fromEntries(keys.map((key) => [key, false])) };
    });
    if (!matchesStatement(st, kw, query)) setQuery("");
    if ((filter === "elements" && !st.isElement) || (filter === "commands" && st.isElement)
      || (filter === "issues" && !st.issues.length)) setFilter("all");
    // Reveal on selection requests; typing a filter or manually folding a group stays possible.
  }, [selected, revealRequest, doc]);

  useEffect(() => {
    const el = listRef.current?.querySelector(".tree-row.selected") as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [selected, revealRequest, collapsed, query, filter, doc]);

  const dndProps = (st: Statement) =>
    onMoveTo
      ? {
          draggable: st.key !== "start" && st.key !== "end",
          onDragStart: (e: React.DragEvent) => {
            e.dataTransfer.setData("application/x-avas-line", String(st.line));
            e.dataTransfer.effectAllowed = "move";
          },
          onDragOver: (e: React.DragEvent) => {
            if (!e.dataTransfer.types.includes("application/x-avas-line")) return;
            e.preventDefault();
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setDropAt({ line: st.line, after: e.clientY > r.top + r.height / 2 });
          },
          onDragLeave: () => setDropAt((d) => (d?.line === st.line ? null : d)),
          onDrop: (e: React.DragEvent) => {
            const from = Number(e.dataTransfer.getData("application/x-avas-line"));
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setDropAt(null);
            if (Number.isFinite(from)) onMoveTo(from, st.line, e.clientY > r.top + r.height / 2);
          },
          onDragEnd: () => setDropAt(null),
        }
      : {};

  const row = (st: Statement, depth: number) => {
    const spec = kw.get(st.key);
    const typeLabel = elementType(st, kw).label;
    return (
      <div
        key={`s${st.line}`}
        className={cx(
          "tree-row",
          selected === st.line && "selected",
          !st.active && "inactive",
          st.active && !st.isElement && "command",
          dropAt?.line === st.line && (dropAt.after ? "drop-after" : "drop-before"),
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
        data-line={st.line}
        onClick={() => onSelect(st.line)}
        onContextMenu={(e) => {
          if (!onContextMenu) return;
          e.preventDefault();
          onSelect(st.line);
          onContextMenu(st.line, e);
        }}
        {...dndProps(st)}
      >
        <span className="tree-icon">{worstIssue(st) ? <IssueIcon st={st} /> : <Swatch st={st} />}</span>
        <span className="tree-name ellipsis">{st.name || st.keyword}</span>
        <span className="tree-type ellipsis" title={typeLabel}>{typeLabel}</span>
        <span className="tree-params ellipsis">{statementSummary(st, spec)}</span>
        <span className="tree-z">{st.active ? fmt6(st.zStart) : ""}</span>
      </div>
    );
  };

  const flat = query.trim() !== "" || filter !== "all";
  const rows: React.ReactNode[] = [];
  if (flat) {
    const needle = query.trim().toLowerCase();
    for (const st of doc.statements) {
      if (filter === "elements" && !st.isElement) continue;
      if (filter === "commands" && st.isElement) continue;
      if (filter === "issues" && !st.issues.length) continue;
      if (needle && !matchesStatement(st, kw, needle)) continue;
      rows.push(row(st, 0));
    }
  } else {
    const walk = (g: GroupNode, depth: number) => {
      for (const child of g.children) {
        if ("s" in child) {
          rows.push(row(doc.statements[child.s], depth));
          continue;
        }
        const stmts: Statement[] = [];
        const collect = (n: GroupNode) => n.children.forEach((c) => ("s" in c ? stmts.push(doc.statements[c.s]) : collect(c)));
        collect(child);
        if (!stmts.length) continue;
        const key = `${child.kind}:${child.line}`;
        const isCollapsed = collapsed[key] ?? child.kind === "superpose";
        const nElements = stmts.filter((s) => s.isElement).length;
        const title = child.kind === "superpose" ? tt("superpose ({n} elements)", { n: nElements }) : child.title;
        const typeLabel = child.kind === "heading" ? tt("group") : child.kind === "period" ? "lattice" : child.kind;
        rows.push(
          <div
            key={`g${key}`}
            className={cx("tree-row group", child.kind !== "superpose" && "bold")}
            style={{ paddingLeft: 8 + depth * 14 }}
            onClick={() => onSelect(stmts[0].line)}
          >
            <span
              className="tree-icon twisty"
              onClick={(e) => {
                e.stopPropagation();
                setCollapsed((c) => ({ ...c, [key]: !(c[key] ?? child.kind === "superpose") }));
              }}
            >
              <Icon name={isCollapsed ? "chevron-right" : "chevron-down"} />
            </span>
            <span className="tree-name ellipsis">{title}</span>
            <span className="tree-type ellipsis">{typeLabel}</span>
            <span className="tree-params" />
            <span className="tree-z">{stmts[0].active ? fmt6(stmts[0].zStart) : ""}</span>
          </div>,
        );
        if (!isCollapsed) walk(child, depth + 1);
      }
    };
    walk(doc.root, 0);
  }

  return (
    <div
      className={cx("structure-tree", compact && "compact")}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (!onKeyCommand || selected == null || (e.target as HTMLElement).tagName === "INPUT") return;
        let cmd: "delete" | "up" | "down" | "duplicate" | null = null;
        if (e.key === "Delete") cmd = "delete";
        else if (e.altKey && e.key === "ArrowUp") cmd = "up";
        else if (e.altKey && e.key === "ArrowDown") cmd = "down";
        else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") cmd = "duplicate";
        else if (!e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
          const lines = [...listRef.current!.querySelectorAll<HTMLElement>(".tree-row[data-line]")].map((el) => Number(el.dataset.line));
          const i = lines.indexOf(selected);
          const next = lines[i + (e.key === "ArrowUp" ? -1 : 1)];
          if (next !== undefined) onSelect(next);
          e.preventDefault();
          return;
        }
        if (cmd) {
          e.preventDefault();
          onKeyCommand(cmd, selected);
        }
      }}
    >
      <div className="row" style={{ gap: 6, padding: "6px 0" }}>
        <div className="search-box grow">
          <Icon name="search" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tt("Search name, type, keyword or field map")} spellCheck={false} />
          {query && (
            <span className="clear" onClick={() => setQuery("")}>
              <Icon name="close" />
            </span>
          )}
        </div>
        <Select<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: tt("All") },
            { value: "elements", label: tt("Elements") },
            { value: "commands", label: tt("Commands") },
            { value: "issues", label: tt("With problems") },
          ]}
        />
      </div>
      <div className="tree-head">
        <span className="tree-icon" />
        <span className="tree-name">{tt("Name")}</span>
        <span className="tree-type">{tt("Type")}</span>
        <span className="tree-params">{tt("Parameters")}</span>
        <span className="tree-z">z (m)</span>
      </div>
      <div className="tree-body" ref={listRef}>
        {rows}
        {!rows.length && <div className="muted" style={{ padding: 12 }}>{tt("Nothing matches.")}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ property panel */
function ParamField({ p, value, readOnly, fieldmaps, onCommit }: { p: Param | null; value: string; readOnly?: boolean; fieldmaps: Record<string, string[]>; onCommit: (v: string) => void }) {
  const kind = p?.kind ?? "float";
  if (p && kind === "enum") {
    const cur = choiceValue(p, value);
    const options = p.choices.map(([v, text]) => ({ value: v, label: pick(text) === v ? v : `${v} — ${pick(text)}` }));
    if (cur === null) options.unshift({ value: value, label: value ? `${value} — ?` : "" });
    return <Select value={cur ?? value} options={options} disabled={readOnly} onChange={(v) => onCommit(v)} />;
  }
  if (kind === "flag") return <Checkbox checked={value === "1"} disabled={readOnly} label={t("on")} onChange={(v) => onCommit(v ? "1" : "0")} />;
  if (kind === "reserved") return <input className="input mono" value={value} readOnly disabled />;
  if (kind === "fieldmap") {
    const listId = "fieldmap-names";
    return (
      <>
        <CommitInput value={value} onCommit={onCommit} disabled={readOnly} mono list={listId} />
        <datalist id={listId}>{Object.keys(fieldmaps).map((n) => <option key={n} value={n} />)}</datalist>
      </>
    );
  }
  const validate = kind === "int" ? (v: string) => v === "" || INT_RE.test(v) : kind === "float" ? (v: string) => v === "" || FLOAT_RE.test(v) : undefined;
  return <CommitInput value={value} onCommit={onCommit} validate={validate} disabled={readOnly} mono />;
}

export function PropertyPanel({ st, kw, readOnly, fieldmaps, onEdits }: { st: Statement | null; kw: Map<string, Keyword>; readOnly?: boolean; fieldmaps: Record<string, string[]>; onEdits: (e: Edit[]) => void }) {
  const tt = useT();
  const schemaField = kw.get("field");
  if (!st) return <div className="property-empty muted">{tt("Select an element or command in the list, the schematic or the text.")}</div>;
  const spec = kw.get(st.key);
  const n = Math.max(spec?.params.length ?? 0, st.params.length);
  const commitParam = (k: number, v: string) => {
    const values = Array.from({ length: Math.max(n, k + 1) }, (_, i) => st.params[i] ?? "");
    values[k] = v.trim();
    const text = formatStatement(st, { params: values });
    if (text !== st.raw) onEdits([[st.line, text]]);
  };
  const commitComment = (v: string) => {
    const comment = v.trim() ? `! ${v.trim()}` : "";
    const text = formatStatement(st, { comment });
    if (text !== st.raw) onEdits([[st.line, text]]);
  };
  const isElementKind = !spec || schemaFieldIsElement(spec);
  const phaseRef = st.key === "field" && schemaField ? choiceLabel(schemaField.params[2], st.params[2] ?? "") : null;
  const fm = st.fieldmap;
  return (
    <div className="property-panel">
      <div className="kpi">
        {spec ? pick(spec.title) : tt("Unknown keyword")}
        <span className="soft" style={{ marginLeft: 10, fontWeight: 400 }}>
          {st.keyword}
        </span>
        <span className="soft" style={{ marginLeft: 10, fontWeight: 400, fontSize: 12 }}>
          {tt("line {n}", { n: st.line + 1 })}
        </span>
      </div>
      {spec && pick(spec.doc) && <p className="muted">{pick(spec.doc)}</p>}
      {!st.active && <p className="soft">{tt("Outside start … end: not simulated.")}</p>}
      {st.issues.length > 0 && (
        <div className="issue-list">
          {st.issues.map((i, k) => (
            <div key={k} className={i.level === "error" ? "danger-text" : "warning-text"}>
              <Icon name={i.level} /> {pick(i.text)}
            </div>
          ))}
        </div>
      )}
      <div className="prop-form">
        {isElementKind && (
          <>
            <label data-tip={tt("Written as 'name : keyword …', or kept in the '!name' comment line.")}>{tt("Name")}</label>
            <div className="prop-field">
              <CommitInput
                value={st.name}
                placeholder={tt("optional")}
                disabled={readOnly}
                onCommit={(v) => {
                  if (v.trim() !== st.name) onEdits(renameEdits(st, v));
                }}
              />
            </div>
          </>
        )}
        {Array.from({ length: n }, (_, k) => {
          const p = spec?.params[k] ?? null;
          const tip = p ? pick(p.doc) : tt("parameter not described in the manual");
          const value = st.params[k] ?? "";
          return (
            <FragmentRow key={k}>
              <label data-tip={tip || undefined}>{p ? pick(p.label) : `P${k + 1}`}</label>
              <div className="prop-field" data-tip={tip || undefined}>
                <ParamField p={p} value={value} readOnly={readOnly} fieldmaps={fieldmaps} onCommit={(v) => commitParam(k, v)} />
                {p?.unit && <span className="unit">{p.unit}</span>}
                {p?.kind === "fieldmap" && fm && (fm.missing || fm.found.length) ? (
                  fm.missing ? (
                    <span className="danger-text nowrap" data-tip={tt("missing: {ext}", { ext: fm.missing })}>
                      ✗ {fm.missing}
                    </span>
                  ) : (
                    <span className="success-text nowrap" data-tip={fm.found.map((e) => `.${e}`).join("  ")}>
                      ✓ {fm.found.map((e) => `.${e}`).join(" ")}
                    </span>
                  )
                ) : null}
              </div>
            </FragmentRow>
          );
        })}
        <label>{tt("Comment")}</label>
        <div className="prop-field">
          <CommitInput value={st.comment.replace(/^!\s*/, "")} placeholder={tt("no comment")} disabled={readOnly} onCommit={commitComment} />
        </div>
      </div>
      <div className="mono muted position selectable">
        {st.active && st.isElement && <div>{tt("z = {a} … {b} m   (length {l} m)", { a: fmt6(st.zStart), b: fmt6(st.zEnd), l: fmt6(st.length) })}</div>}
        {st.active && st.key === "bend" && Number(st.params[0] ?? 0) === 0 && <div>{tt("arc length |α|·ρ = {v} m (computed)", { v: fmt6(st.length) })}</div>}
        {st.active && !st.isElement && <div>{tt("at z = {v} m", { v: fmt6(st.zStart) })}</div>}
        {phaseRef && <div>{tt("phase parameter = {v}", { v: pick(phaseRef) })}</div>}
      </div>
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function schemaFieldIsElement(k: Keyword) {
  return k.category === "field_element" || k.category === "matrix_element" || k.category === "diag";
}

/* ------------------------------------------------------------------ parameter table */
function ParamGrid({ doc, kw, selected, readOnly, onSelect, onEdits }: { doc: LatticeDoc; kw: Map<string, Keyword>; selected: number | null; readOnly?: boolean; onSelect: (line: number) => void; onEdits: (e: Edit[]) => void }) {
  const tt = useT();
  const keys = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of doc.statements) counts.set(s.key, (counts.get(s.key) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => {
      const ea = kw.get(a[0]) && schemaFieldIsElement(kw.get(a[0])!) ? 0 : 1;
      const eb = kw.get(b[0]) && schemaFieldIsElement(kw.get(b[0])!) ? 0 : 1;
      return ea - eb || b[1] - a[1] || a[0].localeCompare(b[0]);
    });
  }, [doc, kw]);
  const [key, setKey] = useState<string>("");
  const selStatement = selected != null ? doc.statements.find((s) => s.line === selected) : undefined;
  const effectiveKey = keys.some(([k]) => k === key) ? key : keys.some(([k]) => k === "field") ? "field" : keys[0]?.[0] ?? "";
  // follow the selection to its keyword (the old grid did not)
  useEffect(() => {
    if (selStatement && selStatement.key !== effectiveKey) setKey(selStatement.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);
  const spec = kw.get(effectiveKey);
  const rows = doc.statements.filter((s) => s.key === effectiveKey);
  const width = Math.max(spec?.params.length ?? 0, ...rows.map((r) => r.params.length), 0);
  const isElem = spec ? schemaFieldIsElement(spec) : false;
  const [cells, setCells] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const anchor = useRef<[number, number] | null>(null);

  const rowEdits = (st: Statement, overrides: Map<number, string>): Edit[] => {
    const values = Array.from({ length: Math.max(st.params.length, spec?.params.length ?? 0) }, (_, i) => st.params[i] ?? "");
    let name: string | undefined;
    for (const [col, value] of overrides) {
      if (col === -1) name = value;
      else {
        while (values.length <= col) values.push("0");
        values[col] = value;
      }
    }
    let edits: Edit[] = name !== undefined && name !== st.name ? renameEdits(st, name) : [];
    const prefixName = name !== undefined && !(st.commentName && !st.prefixName) ? name.trim().replace(/ /g, "_") : undefined;
    const text = formatStatement(st, { params: values, name: prefixName });
    if (edits.some(([l]) => l === st.line)) edits = edits.map(([l, tx]) => [l, l === st.line ? text : tx]);
    else if (text !== st.raw) edits.push([st.line, text]);
    return edits;
  };

  const setSelectedCells = async () => {
    if (!cells.size) return;
    const value = await promptDialog(tt("Value for {n} cells:", { n: cells.size }), "", { title: tt("Set selected cells") });
    if (value === null) return;
    const byRow = new Map<number, Map<number, string>>();
    for (const c of cells) {
      const [r, col] = c.split(":").map(Number);
      if (col === -1 && !isElem) continue;
      if (col >= 0 && spec?.params[col]?.kind === "reserved") continue;
      if (!byRow.has(r)) byRow.set(r, new Map());
      byRow.get(r)!.set(col, value.trim());
    }
    const edits = [...byRow.entries()].flatMap(([r, ov]) => rowEdits(rows[r], ov));
    if (edits.length) onEdits(edits);
  };

  const clickCell = (e: React.MouseEvent, r: number, col: number) => {
    const id = `${r}:${col}`;
    if (e.shiftKey && anchor.current) {
      const [r0, c0] = anchor.current;
      const next = new Set<string>();
      for (let i = Math.min(r0, r); i <= Math.max(r0, r); i++) for (let j = Math.min(c0, col); j <= Math.max(c0, col); j++) next.add(`${i}:${j}`);
      setCells(next);
    } else if (e.ctrlKey || e.metaKey) {
      const next = new Set(cells);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setCells(next);
      anchor.current = [r, col];
    } else {
      setCells(new Set([id]));
      anchor.current = [r, col];
    }
    onSelect(rows[r].line);
  };

  return (
    <div className="param-grid">
      <div className="row" style={{ padding: "6px 0", gap: 8 }}>
        <span className="muted">{tt("Keyword")}</span>
        <Select
          value={effectiveKey}
          style={{ minWidth: 240 }}
          options={keys.map(([k, c]) => ({ value: k, label: `${k}  ·  ${kw.get(k) ? pick(kw.get(k)!.title) : tt("unknown")}  (${c})` }))}
          onChange={(v) => {
            setKey(v);
            setCells(new Set());
          }}
        />
        <div className="grow" />
        <button className="btn btn-ghost btn-small" disabled={readOnly || !cells.size} onClick={setSelectedCells} data-tip={tt("Give every selected cell of the table the same value")}>
          {tt("Set selected cells...")}
        </button>
      </div>
      <div className="grid-scroll">
        <table className="data-grid">
          <thead>
            <tr>
              <th className="col-line">{tt("Line")}</th>
              <th className="col-name">{tt("Name")}</th>
              {Array.from({ length: width }, (_, k) => {
                const p = spec?.params[k];
                return (
                  <th key={k} data-tip={p ? pick(p.doc) || pick(p.label) : tt("parameter not described in the manual")}>
                    {p ? pick(p.label) : `P${k + 1}`}
                    {p?.unit && <div className="th-unit">({p.unit})</div>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((st, r) => (
              <tr key={st.line} className={cx(selected === st.line && "current", !st.active && "inactive")}>
                <td className="col-line" data-tip={st.issues.map((i) => pick(i.text)).join("\n") || undefined}>
                  {worstIssue(st) && <IssueIcon st={st} />} {st.line + 1}
                </td>
                {[-1, ...Array.from({ length: width }, (_, k) => k)].map((col) => {
                  const id = `${r}:${col}`;
                  const p = col >= 0 ? spec?.params[col] : undefined;
                  const raw = col === -1 ? st.name : st.params[col];
                  const missing = col >= 0 && raw === undefined;
                  const editable = !readOnly && (col === -1 ? isElem : p?.kind !== "reserved");
                  const label = p && p.kind === "enum" && raw ? choiceLabel(p, raw) : null;
                  const display = raw === undefined ? "" : label && pick(label) !== raw ? `${raw} — ${pick(label)}` : raw;
                  const isEditing = editing === id;
                  return (
                    <td
                      key={col}
                      className={cx(col === -1 ? "col-name" : p?.kind === "enum" || p?.kind === "fieldmap" || p?.kind === "text" ? "left" : "num", cells.has(id) && "sel", missing && "unused", p?.kind === "reserved" && "reserved")}
                      onMouseDown={(e) => !isEditing && clickCell(e, r, col)}
                      onDoubleClick={() => editable && setEditing(id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && editable && !isEditing) setEditing(id);
                      }}
                      tabIndex={0}
                    >
                      {isEditing ? (
                        p?.kind === "enum" ? (
                          <select
                            autoFocus
                            className="cell-editor"
                            value={(raw && choiceValue(p, raw)) ?? raw ?? ""}
                            onChange={(e) => {
                              setEditing(null);
                              const edits = rowEdits(st, new Map([[col, e.target.value]]));
                              if (edits.length) onEdits(edits);
                            }}
                            onBlur={() => setEditing(null)}
                          >
                            {p.choices.map(([v, text]) => (
                              <option key={v} value={v}>
                                {pick(text) === v ? v : `${v} — ${pick(text)}`}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            autoFocus
                            className="cell-editor mono"
                            defaultValue={raw ?? ""}
                            onBlur={(e) => {
                              setEditing(null);
                              const v = e.target.value.trim();
                              if (v !== (raw ?? "")) {
                                const edits = rowEdits(st, new Map([[col, v]]));
                                if (edits.length) onEdits(edits);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              if (e.key === "Escape") {
                                (e.target as HTMLInputElement).value = raw ?? "";
                                setEditing(null);
                              }
                            }}
                          />
                        )
                      ) : (
                        display
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">{tt("Double-click a cell to edit; the lattice text is updated immediately. Hover a column header for the meaning of the parameter.")}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ editor */
export function StructureEditor({ doc, schema, selected, selectionRequest = 0, onSelect, onEdits, onRangeEdits, getLines, frequency, readOnly, fieldmaps, fieldDirs, parseError }: Props) {
  const tt = useT();
  const kw = useMemo(() => new Map(schema.lattice.map((k) => [k.key, k])), [schema]);
  const [tab, setTab] = useState<"structure" | "table">("structure");
  const [split, setSplit] = useState(0.52);
  const [revealRequest, setRevealRequest] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const st = doc && selected != null ? doc.statements.find((s) => s.line === selected) ?? null : null;

  if (!doc) {
    if (parseError)
      return (
        <div className="empty-state warning-text">
          <Icon name="warning" /> {tt("The lattice could not be parsed: {error}", { error: parseError })}
        </div>
      );
    return <div className="empty-state muted">{tt("Parsing…")}</div>;
  }

  const status = [
    tt("{n} elements", { n: doc.elementCount }),
    tt("total length {v} m", { v: fmt6(doc.totalLength) }),
    tt("{n} RF cavities", { n: doc.rfCount }),
  ];

  return (
    <div className="structure-editor">
      <Beamline doc={doc} schema={schema} selected={selected} onSelect={(l) => { setRevealRequest((n) => n + 1); onSelect(l, "beamline"); }} />
      {parseError && (
        <div className="parse-warning warning-text" role="status" data-tip={parseError}>
          <Icon name="warning" /> {tt("The lattice could not be parsed: {error}", { error: parseError })} {tt("The last good structure is shown.")}
        </div>
      )}
      <Tabs
        value={tab}
        onChange={setTab}
        className="compact-tabs"
        tabs={[
          { value: "structure", label: tt("Structure"), icon: "list-tree" },
          { value: "table", label: tt("Parameter table"), icon: "table" },
        ]}
      />
      <div className="structure-body" ref={bodyRef}>
        {tab === "structure" ? (
          <div className="split">
            <div className="pane" style={{ width: `${split * 100}%` }}>
              <StructureTree
                doc={doc}
                kw={kw}
                selected={selected}
                revealRequest={revealRequest + selectionRequest}
                onSelect={(l) => onSelect(l, "tree")}
                {...(onRangeEdits && getLines ? structureTreeHandlers(doc, getLines, onRangeEdits, { readOnly, frequency }) : {})}
              />
            </div>
            <div
              className="sash sash-v"
              onMouseDown={(e) => {
                const el = bodyRef.current;
                if (!el) return;
                const r = el.getBoundingClientRect();
                const move = (ev: MouseEvent) => setSplit(Math.min(0.8, Math.max(0.2, (ev.clientX - r.left) / r.width)));
                const up = () => {
                  window.removeEventListener("mousemove", move);
                  window.removeEventListener("mouseup", up);
                };
                window.addEventListener("mousemove", move);
                window.addEventListener("mouseup", up);
                e.preventDefault();
              }}
            />
            <div className="pane grow property-scroll structure-inspector">
              {st?.isElement && <ComponentView key={st.line} st={st} kw={kw.get(st.key)} fieldDirs={fieldDirs ?? null} readOnly={readOnly}
                onDraft={() => {}}
                onCommit={(line, values) => {
                  if (readOnly) return;
                  const current = doc.statements.find((s) => s.line === line);
                  if (!current) return;
                  const params = Array.from({ length: Math.max(current.params.length, ...Object.keys(values).map((k) => Number(k) + 1)) }, (_, i) => values[i] ?? current.params[i] ?? "0");
                  const text = formatStatement(current, { params });
                  if (text !== current.raw) onEdits([[line, text]]);
                }} />}
              <PropertyPanel st={st} kw={kw} readOnly={readOnly} fieldmaps={fieldmaps} onEdits={onEdits} />
            </div>
          </div>
        ) : (
          <ParamGrid doc={doc} kw={kw} selected={selected} readOnly={readOnly} onSelect={(l) => onSelect(l, "grid")} onEdits={onEdits} />
        )}
      </div>
      <div className="structure-status soft">
        {status.join("  ·  ")}
        {doc.issueCount > 0 && (
          <span className="warning-text">
            {"  ·  "}
            {tt("{n} problems", { n: doc.issueCount })}
          </span>
        )}
        {doc.issues.map((i, k) => (
          <span key={k}>
            {"  ·  "}
            {pick(i.text)}
          </span>
        ))}
      </div>
    </div>
  );
}
