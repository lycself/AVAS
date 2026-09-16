// Spreadsheet-like grid: cell selection, keyboard navigation, in-place
// editing (text or choice), copy / paste of tab-separated values.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "../components/ui";

export type GridColumn = { title: ReactNode; tip?: string; width?: number; align?: "left" | "right" };

export type CellInfo = {
  display?: string;
  tip?: string;
  className?: string;
  editable?: boolean;
  choices?: { value: string; label: string }[];
};

type Props = {
  columns: GridColumn[];
  rows: string[][];
  rowLabels?: (string | undefined)[];
  cell?: (row: number, col: number, value: string) => CellInfo;
  editable?: boolean;
  onCellsChange?: (changes: { row: number; col: number; value: string }[]) => void;
  onSelectionChange?: (row: number, col: number) => void;
  selectedRows?: (rows: number[]) => void;
  className?: string;
};

export function EditGrid({ columns, rows, rowLabels, cell, editable = true, onCellsChange, onSelectionChange, selectedRows, className }: Props) {
  const [cur, setCur] = useState<[number, number]>([0, 0]);
  const [anchor, setAnchor] = useState<[number, number]>([0, 0]);
  const [editing, setEditing] = useState<{ r: number; c: number; initial?: string } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const nRows = rows.length;
  const nCols = columns.length;

  const info = (r: number, c: number): CellInfo => {
    const v = rows[r]?.[c] ?? "";
    return { editable: editable, ...(cell ? cell(r, c, v) : {}) };
  };

  const inSel = (r: number, c: number) => r >= Math.min(anchor[0], cur[0]) && r <= Math.max(anchor[0], cur[0]) && c >= Math.min(anchor[1], cur[1]) && c <= Math.max(anchor[1], cur[1]);

  useEffect(() => {
    onSelectionChange?.(cur[0], cur[1]);
    if (selectedRows) {
      const out: number[] = [];
      for (let r = Math.min(anchor[0], cur[0]); r <= Math.max(anchor[0], cur[0]); r++) out.push(r);
      selectedRows(out);
    }
    const el = wrapRef.current?.querySelector(`[data-cell="${cur[0]}:${cur[1]}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur[0], cur[1], anchor[0], anchor[1]]);

  const move = (r: number, c: number, extend: boolean) => {
    const nr = Math.max(0, Math.min(nRows - 1, r));
    const nc = Math.max(0, Math.min(nCols - 1, c));
    setCur([nr, nc]);
    if (!extend) setAnchor([nr, nc]);
  };

  const editingRef = useRef(editing);
  editingRef.current = editing;
  const commit = (r: number, c: number, value: string) => {
    const ed = editingRef.current;
    if (!ed || ed.r !== r || ed.c !== c) return;
    editingRef.current = null;
    setEditing(null);
    if ((rows[r]?.[c] ?? "") !== value) onCellsChange?.([{ row: r, col: c, value }]);
    wrapRef.current?.focus();
  };

  const selectionCells = () => {
    const out: [number, number][] = [];
    for (let r = Math.min(anchor[0], cur[0]); r <= Math.max(anchor[0], cur[0]); r++)
      for (let c = Math.min(anchor[1], cur[1]); c <= Math.max(anchor[1], cur[1]); c++) out.push([r, c]);
    return out;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (editing || !nRows) return;
    const [r, c] = cur;
    const ctrl = e.ctrlKey || e.metaKey;
    if (e.key === "ArrowDown") move(r + 1, c, e.shiftKey);
    else if (e.key === "ArrowUp") move(r - 1, c, e.shiftKey);
    else if (e.key === "ArrowLeft") move(r, c - 1, e.shiftKey);
    else if (e.key === "ArrowRight" || e.key === "Tab") move(r, c + (e.shiftKey && e.key === "Tab" ? -1 : 1), e.shiftKey && e.key !== "Tab");
    else if (e.key === "Home") move(r, 0, e.shiftKey);
    else if (e.key === "End") move(r, nCols - 1, e.shiftKey);
    else if (e.key === "Enter" || e.key === "F2") {
      if (info(r, c).editable) setEditing({ r, c });
    } else if (e.key === "Delete" || e.key === "Backspace") {
      const changes = selectionCells()
        .filter(([rr, cc]) => info(rr, cc).editable && !info(rr, cc).choices)
        .map(([rr, cc]) => ({ row: rr, col: cc, value: "" }));
      if (changes.length) onCellsChange?.(changes);
    } else if (ctrl && e.key.toLowerCase() === "c") {
      const r0 = Math.min(anchor[0], cur[0]);
      const r1 = Math.max(anchor[0], cur[0]);
      const c0 = Math.min(anchor[1], cur[1]);
      const c1 = Math.max(anchor[1], cur[1]);
      const lines = [];
      for (let rr = r0; rr <= r1; rr++) lines.push(rows[rr].slice(c0, c1 + 1).map((v) => v ?? "").join("\t"));
      navigator.clipboard?.writeText(lines.join("\n")).catch(() => undefined);
    } else if (ctrl && e.key.toLowerCase() === "v") {
      navigator.clipboard
        ?.readText()
        .then((text) => {
          const grid = text.replace(/\r/g, "").replace(/\n$/, "").split("\n").map((l) => l.split(/\t|,(?=\S)| {2,}/));
          const changes: { row: number; col: number; value: string }[] = [];
          grid.forEach((line, i) =>
            line.forEach((v, j) => {
              const rr = cur[0] + i;
              const cc = cur[1] + j;
              if (rr < nRows && cc < nCols && info(rr, cc).editable) changes.push({ row: rr, col: cc, value: v.trim() });
            }),
          );
          if (changes.length) onCellsChange?.(changes);
        })
        .catch(() => undefined);
    } else if (ctrl && e.key.toLowerCase() === "a") {
      setAnchor([0, 0]);
      setCur([nRows - 1, nCols - 1]);
    } else if (!ctrl && !e.altKey && e.key.length === 1 && info(r, c).editable && !info(r, c).choices) {
      setEditing({ r, c, initial: e.key });
    } else return;
    e.preventDefault();
  };

  return (
    <div className={cx("grid-scroll", className)} ref={wrapRef} tabIndex={0} onKeyDown={onKeyDown}>
      <table className="data-grid">
        <thead>
          <tr>
            {rowLabels !== undefined && <th className="col-line">#</th>}
            {columns.map((col, i) => (
              <th key={i} data-tip={col.tip} style={col.width ? { minWidth: col.width } : undefined}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {rowLabels !== undefined && <td className="col-line">{rowLabels[r] ?? r + 1}</td>}
              {columns.map((col, c) => {
                const ci = info(r, c);
                const value = row[c] ?? "";
                const isEditing = editing && editing.r === r && editing.c === c;
                return (
                  <td
                    key={c}
                    data-cell={`${r}:${c}`}
                    data-tip={ci.tip}
                    className={cx(col.align === "right" ? "num" : "left", ci.className, inSel(r, c) && "sel", cur[0] === r && cur[1] === c && "cursor")}
                    onMouseDown={(e) => {
                      if (isEditing) return;
                      move(r, c, e.shiftKey);
                      wrapRef.current?.focus();
                    }}
                    onDoubleClick={() => ci.editable && setEditing({ r, c })}
                  >
                    {isEditing ? (
                      ci.choices ? (
                        <select autoFocus className="cell-editor" defaultValue={value} onChange={(e) => commit(r, c, e.target.value)} onBlur={() => setEditing(null)}>
                          {!ci.choices.some((o) => o.value === value) && <option value={value}>{value}</option>}
                          {ci.choices.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          autoFocus
                          className="cell-editor mono"
                          defaultValue={editing?.initial ?? value}
                          onFocus={(e) => {
                            if (editing?.initial) {
                              const el = e.target;
                              requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
                            }
                          }}
                          onBlur={(e) => commit(r, c, e.target.value.trim())}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") {
                              commit(r, c, (e.target as HTMLInputElement).value.trim());
                              move(r + 1, c, false);
                            } else if (e.key === "Tab") {
                              e.preventDefault();
                              commit(r, c, (e.target as HTMLInputElement).value.trim());
                              move(r, c + 1, false);
                            } else if (e.key === "Escape") {
                              setEditing(null);
                              wrapRef.current?.focus();
                            }
                          }}
                        />
                      )
                    ) : (
                      ci.display ?? value
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
