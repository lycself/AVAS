// Table views of the engine's text inputs.  The text stays the single source
// of truth: every table edit re-serialises the text.  Unlike the old Qt
// tables, comments on data lines and their position are preserved.
import { useMemo, useState } from "react";
import { DialogFrame, showDialog } from "../components/overlays";
import { Button, cx } from "../components/ui";
import { pick, t, useT } from "../i18n";
import { choiceLabel, choiceValue, type Keyword, type Schema } from "../lattice/types";
import { EditGrid, type GridColumn } from "./EditGrid";

type TableProps = { text: string; editable: boolean; onChange: (text: string) => void; schema: Schema };

function splitComment(line: string): [string, string] {
  const i = line.indexOf("!");
  return i < 0 ? [line, ""] : [line.slice(0, i), line.slice(i)];
}

function finish(lines: string[]): string {
  return lines.join("\n").replace(/\n+$/, "") + "\n";
}

function tokensToLine(tokens: string[], comment = ""): string {
  const t2 = tokens.map((x) => x.trim());
  while (t2.length && t2[t2.length - 1] === "") t2.pop();
  const line = t2.map((x) => (x === "" ? "0" : x)).join(" ");
  return comment ? `${line} ${comment}` : line;
}

/* ------------------------------------------------------------------ keyword table (beam.txt / input.txt) */
type KwModel = { lines: string[]; rows: { line: number; tokens: string[]; comment: string }[] };

function parseKeywords(text: string): KwModel {
  const lines = text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
  const rows: KwModel["rows"] = [];
  lines.forEach((line, i) => {
    const [code, comment] = splitComment(line);
    const tokens = code.trim().split(/\s+/).filter(Boolean);
    if (tokens.length) rows.push({ line: i, tokens, comment: comment.trim() });
  });
  return { lines: text ? lines : [], rows };
}

export function KeywordTable({ text, editable, onChange, schema, file }: TableProps & { file: "beam" | "input" }) {
  const tt = useT();
  const keywords = useMemo(() => new Map((file === "beam" ? schema.beam : schema.input).map((k) => [k.key, k])), [schema, file]);
  const model = useMemo(() => parseKeywords(text), [text]);
  const [current, setCurrent] = useState<[number, number]>([0, 0]);
  const [selRows, setSelRows] = useState<number[]>([]);
  const width = Math.max(3, ...model.rows.map((r) => r.tokens.length - 1), ...model.rows.map((r) => keywords.get(r.tokens[0].toLowerCase())?.params.length ?? 0));

  const columns: GridColumn[] = [
    { title: tt("Keyword"), width: 160 },
    { title: tt("Meaning"), width: 170 },
    ...Array.from({ length: width }, (_, i) => ({ title: tt("Value {n}", { n: i + 1 }), width: 110 })),
  ];
  const gridRows = model.rows.map((r) => {
    const spec = keywords.get(r.tokens[0].toLowerCase());
    let meaning = spec ? pick(spec.title) : "";
    if (spec && spec.params.some((p) => p.unit)) meaning += `  [${spec.params.map((p) => p.unit || "–").join(", ")}]`;
    return [r.tokens[0], meaning, ...Array.from({ length: width }, (_, i) => r.tokens[i + 1] ?? "")];
  });

  const write = (rows: KwModel["rows"]) => {
    const out: (string | null)[] = [...model.lines];
    const extra: string[] = [];
    for (const r of rows) {
      const line = r.tokens[0]?.trim() ? tokensToLine(r.tokens, r.comment) : null; // an emptied keyword removes the row
      if (r.line >= 0) out[r.line] = line;
      else if (line) extra.push(line);
    }
    onChange(finish([...out.filter((l): l is string => l !== null), ...extra]));
  };

  const paramTip = (spec: Keyword, k: number) => {
    const p = spec.params[k];
    if (!p) return undefined;
    return `${pick(p.label)}${p.unit ? ` (${p.unit})` : ""}${pick(p.doc) ? ": " + pick(p.doc) : ""}`;
  };

  const detailRow = model.rows[current[0]];
  const detailSpec = detailRow ? keywords.get(detailRow.tokens[0].toLowerCase()) : undefined;

  const addKeyword = async () => {
    const present = new Set(model.rows.map((r) => r.tokens[0].toLowerCase()));
    const options = [...keywords.values()].filter((k) => !present.has(k.key));
    if (!options.length) return;
    const key = await showDialog<string | null>(
      (close) => (
        <DialogFrame title={t("Add keyword")} onClose={() => close(null)}>
          <div className="list" style={{ maxHeight: 360, minWidth: 420 }}>
            {options.map((k) => (
              <div key={k.key} className="list-item" onClick={() => close(k.key)}>
                <span className="mono">{k.key}</span>
                <span className="muted grow">{pick(k.title)}</span>
              </div>
            ))}
          </div>
        </DialogFrame>
      ),
      { dismissValue: null },
    );
    if (!key) return;
    const spec = keywords.get(key)!;
    const tokens = [key, ...spec.params.map((p) => (p.kind === "enum" && p.choices.length ? p.choices[0][0] : "0"))];
    write([...model.rows, { line: -1, tokens, comment: "" }]);
  };

  const removeSelected = () => {
    const drop = new Set(selRows);
    const lines = model.lines.filter((_, i) => !model.rows.some((r, k) => drop.has(k) && r.line === i));
    onChange(finish(lines));
  };

  return (
    <div className="table-view">
      <EditGrid
        columns={columns}
        rows={gridRows}
        editable={editable}
        onSelectionChange={(r, c) => setCurrent([r, c])}
        selectedRows={setSelRows}
        cell={(r, c, value) => {
          const row = model.rows[r];
          const spec = keywords.get(row.tokens[0].toLowerCase());
          if (c === 0) return spec ? { tip: pick(spec.doc) || pick(spec.title) } : { className: "warning-text", tip: t("Not in the manual; kept as it is.") };
          if (c === 1) return { editable: false, className: "muted" };
          const k = c - 2;
          const p = spec?.params[k];
          if (!spec) return {};
          if (!p) return { className: "unused" };
          const label = p.kind === "enum" && value ? choiceLabel(p, value) : null;
          return {
            tip: paramTip(spec, k),
            display: label && pick(label) !== value ? `${value} — ${pick(label)}` : value,
            choices: p.kind === "enum" ? p.choices.map(([v, txt]) => ({ value: v, label: pick(txt) === v ? v : `${v} — ${pick(txt)}` })) : undefined,
          };
        }}
        onCellsChange={(changes) => {
          const rows = model.rows.map((r) => ({ ...r, tokens: [...r.tokens] }));
          for (const { row, col, value } of changes) {
            if (col === 1) continue;
            const idx = col === 0 ? 0 : col - 1;
            const tokens = rows[row].tokens;
            while (tokens.length <= idx) tokens.push("");
            const spec = keywords.get(tokens[0].toLowerCase());
            const p = col > 1 ? spec?.params[col - 2] : undefined;
            tokens[idx] = p && p.kind === "enum" ? choiceValue(p, value) ?? value : value;
          }
          write(rows);
        }}
      />
      <div className="table-detail muted">
        {detailSpec ? (
          <>
            <b>{detailSpec.key}</b> — {pick(detailSpec.title)}
            {pick(detailSpec.doc) ? `: ${pick(detailSpec.doc)}` : ""}
            {detailSpec.params.map((_p, k) => (
              <div key={k} className={cx(current[1] - 2 === k && "strong")}>
                {current[1] - 2 === k ? "▸ " : "  "}
                {tt("Value {n}", { n: k + 1 })}: {paramTip(detailSpec, k)}
              </div>
            ))}
          </>
        ) : null}
      </div>
      <div className="row">
        <div className="grow" />
        <Button small variant="ghost" icon="add" disabled={!editable} onClick={addKeyword}>
          {tt("Add keyword...")}
        </Button>
        <Button small variant="ghost" icon="remove" disabled={!editable || !selRows.length} onClick={removeSelected}>
          {tt("Remove selected")}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ ini.ini */
export function IniTable({ text, editable, onChange, schema }: TableProps) {
  const tt = useT();
  const lines = useMemo(() => text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n"), [text]);
  const meanings = useMemo(() => new Map(schema.ini.map((e) => [`${e.section}/${e.key}`, e.meaning])), [schema]);
  const entries: { line: number; section: string; key: string; value: string }[] = [];
  let section = "";
  lines.forEach((l, i) => {
    const s = l.trim();
    const m = /^\[(.+)\]$/.exec(s);
    if (m) section = m[1];
    else if (s.includes("=") && !s.startsWith("#") && !s.startsWith(";")) {
      const idx = s.indexOf("=");
      entries.push({ line: i, section, key: s.slice(0, idx).trim(), value: s.slice(idx + 1).trim() });
    }
  });
  return (
    <div className="table-view">
      <EditGrid
        columns={[{ title: tt("Section"), width: 90 }, { title: tt("Key"), width: 150 }, { title: tt("Value"), width: 220 }, { title: tt("Meaning"), width: 320 }]}
        rows={entries.map((e) => [e.section, e.key, e.value, pick(meanings.get(`${e.section}/${e.key}`) ?? ["", ""])])}
        editable={editable}
        cell={(_r, c) => (c === 2 ? {} : { editable: false, className: c === 3 ? "muted" : undefined })}
        onCellsChange={(changes) => {
          const out = [...lines];
          for (const ch of changes) {
            if (ch.col !== 2) continue;
            const e = entries[ch.row];
            out[e.line] = `${e.key} = ${ch.value}`.trimEnd() + (ch.value ? "" : " ");
          }
          onChange(finish(out));
        }}
      />
      <p className="hint">{tt("Settings used by the GUI and by 'avas run' (run mode, error study, lattice file, field-map directory). Most are also set on the Settings and Lattice pages.")}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ generic token tables */
export type TokenColumn = { caption: string; tip?: string };

export function TokenTable({ text, editable, onChange, columns, wrapStartEnd, rowLabels, hint }: Omit<TableProps, "schema"> & { columns: TokenColumn[]; wrapStartEnd?: boolean; rowLabels?: string[]; hint?: string }) {
  const tt = useT();
  const lines = useMemo(() => text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n"), [text]);
  const rows: { line: number; tokens: string[]; comment: string }[] = [];
  lines.forEach((l, i) => {
    const [code, comment] = splitComment(l);
    const tokens = code.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return;
    if (wrapStartEnd && tokens.length === 1 && ["start", "end"].includes(tokens[0].toLowerCase())) return;
    rows.push({ line: i, tokens, comment: comment.trim() });
  });
  const width = Math.max(columns.length, ...rows.map((r) => r.tokens.length));
  const cols: GridColumn[] = Array.from({ length: width }, (_, k) => ({
    title: columns[k]?.caption ?? `V${k + 1}`,
    tip: columns[k]?.tip ?? tt("extra value {n}", { n: k + 1 }),
    width: 96,
    align: "right",
  }));
  const [selRows, setSelRows] = useState<number[]>([]);

  const build = (newRows: { line: number; tokens: string[]; comment: string }[]) => {
    const out = [...lines];
    const removed = new Set(rows.filter((r) => !newRows.some((n) => n.line === r.line)).map((r) => r.line));
    const appended: string[] = [];
    for (const r of newRows) {
      const line = tokensToLine(r.tokens, r.comment);
      if (r.line >= 0) out[r.line] = line;
      else appended.push(line);
    }
    let result = out.filter((_, i) => !removed.has(i));
    if (appended.length) {
      // new rows go after the last data row (before a trailing "end")
      const endIdx = wrapStartEnd ? result.findIndex((l) => l.trim().toLowerCase() === "end") : -1;
      if (endIdx >= 0) result.splice(endIdx, 0, ...appended);
      else result = [...result.filter((l, i) => !(i === result.length - 1 && l === "")), ...appended];
    }
    if (wrapStartEnd) {
      if (!result.some((l) => l.trim().toLowerCase() === "start")) result.unshift("start");
      if (!result.some((l) => l.trim().toLowerCase() === "end")) result.push("end");
    }
    onChange(finish(result));
  };

  return (
    <div className="table-view">
      <EditGrid
        columns={cols}
        rows={rows.map((r) => Array.from({ length: width }, (_, k) => r.tokens[k] ?? ""))}
        rowLabels={rows.map((_, i) => rowLabels?.[i] ?? String(i + 1))}
        editable={editable}
        selectedRows={setSelRows}
        onCellsChange={(changes) => {
          const next = rows.map((r) => ({ ...r, tokens: [...r.tokens] }));
          for (const ch of changes) {
            while (next[ch.row].tokens.length <= ch.col) next[ch.row].tokens.push("");
            next[ch.row].tokens[ch.col] = ch.value;
          }
          build(next);
        }}
      />
      <div className="row">
        {hint && <span className="hint grow">{hint}</span>}
        {!hint && <div className="grow" />}
        <Button
          small
          variant="ghost"
          icon="add"
          disabled={!editable}
          onClick={() => build([...rows, { line: -1, tokens: rows.length ? [...rows[rows.length - 1].tokens] : Array(columns.length).fill("0"), comment: "" }])}
        >
          {tt("Add row")}
        </Button>
        <Button small variant="ghost" icon="remove" disabled={!editable || !selRows.length} onClick={() => build(rows.filter((_, i) => !selRows.includes(i)))}>
          {tt("Remove selected")}
        </Button>
      </div>
    </div>
  );
}

export const BOUNDARY_COLUMNS: TokenColumn[] = [
  ["type", "int - boundary type"],
  ["material", "string - e.g. copper"],
  ["length (m)", "double - length along z"],
  ["r1 (m)", "double - aperture at the entrance"],
  ["r2 (m)", "double - aperture at the exit"],
  ["RLP", "string - shape keyword (RLP)"],
  ["z0 (m)", "double - z offset"],
  ["x0 (m)", "double - x offset"],
  ["y0 (m)", "double - y offset"],
  ["θz0 (deg)", "double - rotation about z"],
  ["θx0 (deg)", "double - rotation about x"],
  ["θy0 (deg)", "double - rotation about y"],
].map(([caption, tip]) => ({ caption, tip }));

export function scanDataColumns(): TokenColumn[] {
  return [
    { caption: t("entry phase (deg)"), tip: t("RF phase at the cavity entrance") },
    { caption: t("entry time (s)"), tip: t("arrival time at the cavity entrance") },
  ];
}

/* ------------------------------------------------------------------ TraceWin (read only) */
export function TraceWinTable({ text, schema }: { text: string; schema: Schema }) {
  const tt = useT();
  const words = new Set(schema.tracewinWords);
  const rows: { line: number; key: string; params: string[] }[] = [];
  text.split(/\r?\n/).forEach((l, i) => {
    const code = l.split(";")[0].trim();
    if (!code) return;
    const tokens = code.split(/\s+/);
    rows.push({ line: i + 1, key: tokens[0], params: tokens.slice(1, 11) });
  });
  return (
    <div className="table-view">
      <EditGrid
        editable={false}
        columns={[{ title: tt("Line"), width: 52, align: "right" }, { title: tt("Keyword"), width: 140 }, ...Array.from({ length: 10 }, (_, k) => ({ title: `P${k + 1}`, width: 80, align: "right" as const }))]}
        rows={rows.map((r) => [String(r.line), r.key, ...Array.from({ length: 10 }, (_, k) => r.params[k] ?? "")])}
        cell={(r, c) => {
          const row = rows[r];
          if (c === 1 && !words.has(row.key.toLowerCase())) return { className: "muted" };
          if (c >= 2) {
            const p = schema.tracewinParams[row.key.toLowerCase()]?.[c - 2];
            if (p) return { tip: p[1] ? `${p[0]} (${p[1]})` : p[0] };
          }
          return {};
        }}
      />
      <p className="hint">{tt("TraceWin lattice (lengths in mm). AVAS cannot run it directly; it is shown read-only. Hover a value for its meaning where it is known.")}</p>
    </div>
  );
}
