// Visual lattice editor: component palette, large layout (or 3D) view with the
// beam envelope, outline tree and the component inspector.  It edits the same
// text model as the text editor (kept mounted by LatticeEditor), so undo,
// saving and the dirty state work exactly as in the text mode.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { call } from "../bridge";
import { openMenu, openMenuBelow } from "../components/overlays";
import { Button, cx, Icon, IconButton, Segmented, Spinner } from "../components/ui";
import { pick, useT } from "../i18n";
import { useApp } from "../store/app";
import { ComponentView, type Draft } from "./ComponentView";
import { LayoutView, PALETTE_MIME, type LayoutShow } from "./LayoutView";
import { PropertyPanel, StructureTree, structureTreeHandlers } from "./StructureEditor";
import { applyResult, elementOptions, PALETTE, structureMenu, type ApplyRange } from "./structureMenu";
import { defaultLength, deleteUnit, duplicateUnit, insertAfter, insertAtZ, moveUnit, newElementText, type NewElementKind } from "./structureOps";
import { formatStatement, type Edit, type LatticeDoc, type Schema, type Statement } from "./types";
import { replaceLine, useLinearPreview, useRunEnvelope } from "./usePreview";

const Beamline3D = lazy(() => import("./Beamline3D"));

type Props = {
  doc: LatticeDoc | null;
  schema: Schema;
  selected: number | null;
  onSelect: (line: number, source: string) => void;
  onEdits: (edits: Edit[]) => void;
  onRangeEdits: ApplyRange;
  getText: () => string;
  fieldDirs: string[] | null;
  fieldmaps: Record<string, string[]>;
  readOnly?: boolean;
  showText: boolean;
  onToggleText: () => void;
  onUndo: () => void;
  onRedo: () => void;
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

const DEFAULT_SHOW: LayoutShow = { run: true, preview: true, aperture: true, losses: true, max: false, energy: false, scale: "beam" };

export function VisualEditor({ doc, schema, selected, onSelect, onEdits, onRangeEdits, getText, fieldDirs, fieldmaps, readOnly, showText, onToggleText, onUndo, onRedo }: Props) {
  const t = useT();
  const theme = useApp((s) => s.resolvedTheme);
  const kw = useMemo(() => new Map(schema.lattice.map((k) => [k.key, k])), [schema]);
  const [show, setShowState] = useState<LayoutShow>(() => load("avas.visual.show", DEFAULT_SHOW));
  const [view, setView] = useState<"2d" | "3d">(() => (localStorage.getItem("avas.visual.view") === "3d" ? "3d" : "2d"));
  const [spaceCharge, setSpaceCharge] = useState<boolean>(() => localStorage.getItem("avas.visual.sc") !== "0");
  const [layoutH, setLayoutH] = useState(() => Number(localStorage.getItem("avas.visual.layoutH")) || 380);
  const [outlineW, setOutlineW] = useState(() => Number(localStorage.getItem("avas.visual.outlineW")) || 380);
  const [fitSignal, setFitSignal] = useState(0);
  const [frequency, setFrequency] = useState<number | undefined>(undefined);
  const hostRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const setShow = (patch: Partial<LayoutShow>) =>
    setShowState((s) => {
      const next = { ...s, ...patch };
      save("avas.visual.show", next);
      return next;
    });

  const run = useRunEnvelope(show.run);
  const preview = useLinearPreview({ enabled: show.preview, fieldDirs, spaceCharge });
  const drafting = useRef(false);

  useEffect(() => {
    call<{ form: Record<string, string> }>("beam.load")
      .then((b) => setFrequency(Number(b.form.frequency) || undefined))
      .catch(() => undefined);
  }, []);

  // recompute the preview whenever the parsed document changes (i.e. after text edits)
  useEffect(() => {
    if (doc && show.preview && !drafting.current) preview.request(getText());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, show.preview]);

  const st: Statement | null = doc && selected != null ? doc.statements.find((s) => s.line === selected) ?? null : null;
  const lines = useCallback(() => getText().split(/\r?\n/), [getText]);

  const onDraft = useCallback(
    (line: number, draft: Draft | null) => {
      if (!doc) return;
      const s = doc.statements.find((x) => x.line === line);
      if (!s) return;
      if (!draft) {
        drafting.current = false;
        return;
      }
      drafting.current = true;
      if (!show.preview) return;
      const values = Array.from({ length: Math.max(s.params.length, ...Object.keys(draft).map((k) => Number(k) + 1)) }, (_, i) => draft[i] ?? s.params[i] ?? "0");
      preview.request(replaceLine(getText(), line, formatStatement(s, { params: values })));
    },
    [doc, getText, preview, show.preview],
  );

  const onCommit = useCallback(
    (line: number, values: Draft) => {
      if (!doc || readOnly) return;
      const s = doc.statements.find((x) => x.line === line);
      if (!s) return;
      const params = Array.from({ length: Math.max(s.params.length, ...Object.keys(values).map((k) => Number(k) + 1)) }, (_, i) => values[i] ?? s.params[i] ?? "0");
      const text = formatStatement(s, { params });
      if (text !== s.raw) onEdits([[line, text]]);
    },
    [doc, onEdits, readOnly],
  );

  const dropElement = (z: number, kind: NewElementKind) => {
    if (!doc || readOnly) return;
    const opts = elementOptions(doc, selected, frequency);
    const L = defaultLength(kind);
    applyResult(insertAtZ(doc, lines(), z, newElementText(kind, { ...opts, length: L }), L), onRangeEdits);
  };

  const insertKind = (kind: NewElementKind) => {
    if (!doc || readOnly) return;
    const opts = elementOptions(doc, selected, frequency);
    const text = newElementText(kind, { ...opts, length: defaultLength(kind) });
    if (selected != null) applyResult(insertAfter(doc, lines(), selected, text), onRangeEdits);
    else {
      const end = doc.statements.find((s) => s.key === "end" && s.active);
      applyResult(insertAtZ(doc, lines(), end?.zStart ?? doc.totalLength, text, defaultLength(kind)), onRangeEdits);
    }
  };

  const startResize = (axis: "y" | "x") => (e: React.MouseEvent) => {
    e.preventDefault();
    const start = axis === "y" ? e.clientY : e.clientX;
    const base = axis === "y" ? layoutH : outlineW;
    const total = axis === "y" ? hostRef.current?.clientHeight ?? 800 : bottomRef.current?.clientWidth ?? 1000;
    let last = base;
    document.body.classList.add("dragging");
    const move = (ev: MouseEvent) => {
      const d = (axis === "y" ? ev.clientY : ev.clientX) - start;
      last = Math.max(axis === "y" ? 160 : 220, Math.min(total - (axis === "y" ? 180 : 320), base + d));
      if (axis === "y") setLayoutH(last);
      else setOutlineW(last);
    };
    const up = () => {
      document.body.classList.remove("dragging");
      localStorage.setItem(axis === "y" ? "avas.visual.layoutH" : "avas.visual.outlineW", String(Math.round(last)));
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const pv = preview.data;
  // memoised: the 3D view rebuilds its envelope tube whenever this object changes
  const envelope3d = useMemo(
    () =>
      show.preview && pv
        ? { z: pv.z, x: pv.rms_x, y: pv.rms_y, label: t("linear preview") }
        : show.run && run.data
          ? { z: run.data.z, x: run.data.rmsX, y: run.data.rmsY, label: t("last run") }
          : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [show.preview, show.run, pv, run.data],
  );

  if (!doc) return <div className="empty-state"><Spinner size={24} /></div>;

  const warnings = pv?.warnings ?? [];
  const energy = pv && st ? pv.elements.find((e) => e.line === st.line) ?? null : null;
  return (
    <div
      className="visual-editor"
      ref={hostRef}
      tabIndex={-1}
      onKeyDown={(e) => {
        // the text editor is hidden here: route undo / redo to it unless a field has the focus
        const el = e.target as HTMLElement;
        if (readOnly || el.closest("input, textarea, select, .monaco-editor")) return;
        const key = e.key.toLowerCase();
        if ((e.ctrlKey || e.metaKey) && key === "z" && !e.shiftKey) {
          e.preventDefault();
          onUndo();
        } else if ((e.ctrlKey || e.metaKey) && (key === "y" || (key === "z" && e.shiftKey))) {
          e.preventDefault();
          onRedo();
        }
      }}
    >
      <div className="ve-toolbar">
        <IconButton icon="discard" tip={t("Undo (Ctrl+Z)")} disabled={readOnly} onClick={onUndo} />
        <IconButton icon="redo" tip={t("Redo (Ctrl+Y)")} disabled={readOnly} onClick={onRedo} />
        <div className="divider-v" />
        <div className="ve-palette" data-tip={t("Drag a component onto the beamline, or click to insert it after the selection")}>
          {PALETTE.slice(0, 8).map((p) => (
            <button
              key={p.kind}
              className="ve-chip"
              draggable={!readOnly}
              disabled={readOnly}
              onDragStart={(e) => {
                e.dataTransfer.setData(PALETTE_MIME, p.kind);
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => insertKind(p.kind)}
              data-tip={t(p.label)}
            >
              <span className="ve-chip-swatch" style={{ background: `var(${p.color})` }} />
              <span className="ve-chip-label">{t(p.label)}</span>
            </button>
          ))}
          <IconButton
            icon="ellipsis"
            tip={t("More components")}
            disabled={readOnly}
            onClick={(e) => openMenuBelow(e.currentTarget, PALETTE.slice(8).map((p) => ({ label: t(p.label), onClick: () => insertKind(p.kind) })))}
          />
        </div>
        <div className="grow" />
        <Segmented
          value={view}
          onChange={(v) => {
            setView(v);
            localStorage.setItem("avas.visual.view", v);
          }}
          options={[
            { value: "2d", label: "2D", icon: "graph-line", tip: t("Layout and envelope along z") },
            { value: "3d", label: "3D", icon: "globe", tip: t("Three-dimensional view") },
          ]}
        />
        <Button
          small
          icon="layers"
          onClick={(e) =>
            openMenu(
              [
                { type: "header", label: t("Envelope") },
                { label: t("Last run"), checked: show.run, onClick: () => setShow({ run: !show.run }) },
                { label: t("Linear preview"), checked: show.preview, onClick: () => setShow({ preview: !show.preview }) },
                { label: t("Space charge in the preview"), checked: spaceCharge, disabled: !show.preview, onClick: () => {
                  setSpaceCharge(!spaceCharge);
                  localStorage.setItem("avas.visual.sc", spaceCharge ? "0" : "1");
                } },
                { label: t("Maximum sizes (last run)"), checked: show.max, disabled: !show.run, onClick: () => setShow({ max: !show.max }) },
                { type: "separator" },
                { label: t("Pipe apertures"), checked: show.aperture, onClick: () => setShow({ aperture: !show.aperture }) },
                { label: t("Particle losses"), checked: show.losses, onClick: () => setShow({ losses: !show.losses }) },
                { label: t("Energy (right axis)"), checked: show.energy, onClick: () => setShow({ energy: !show.energy }) },
                { type: "separator" },
                { label: t("Vertical scale: beam"), checked: show.scale === "beam", onClick: () => setShow({ scale: "beam" }) },
                { label: t("Vertical scale: pipe"), checked: show.scale === "pipe", onClick: () => setShow({ scale: "pipe" }) },
              ],
              (e.currentTarget as HTMLElement).getBoundingClientRect().left,
              (e.currentTarget as HTMLElement).getBoundingClientRect().bottom + 2,
            )
          }
        >
          {t("Overlays")}
        </Button>
        <IconButton icon="screen-full" tip={t("Fit the whole lattice (double-click the view)")} onClick={() => setFitSignal((n) => n + 1)} />
        <IconButton icon={showText ? "layout-sidebar-right" : "layout-sidebar-right-off"} tip={showText ? t("Hide the text") : t("Show the text next to the visual editor")} active={showText} onClick={onToggleText} />
      </div>
      <div className="ve-status soft">
        {show.preview && (
          <span className={cx("ve-status-item", preview.error && "danger-text")} data-tip={preview.error ?? warnings.map((w) => pick(w)).join("\n") ?? undefined}>
            {preview.busy ? <Spinner size={12} /> : <i className="lg-line dashed" style={{ borderColor: "var(--el-rf)" }} />}
            {preview.error
              ? t("preview failed")
              : pv
                ? t("linear preview {ms} ms{sc}", { ms: Math.round(pv.model?.elapsed_ms ?? 0), sc: pv.model?.space_charge ? t(", with space charge") : "" })
                : t("linear preview…")}
            {warnings.length > 0 && (
              <span className="warning-text">
                {" · "}
                <Icon name="warning" /> {warnings.length}
              </span>
            )}
          </span>
        )}
        {show.run && (
          <span className="ve-status-item">
            {run.data ? (
              <>
                <i className="lg-line" style={{ background: "var(--el-bmag)" }} />
                {t("last run {date}", { date: run.data.started ?? "" })}
                {run.data.lattice ? ` · ${run.data.lattice}` : ""}
              </>
            ) : (
              t("no run results yet")
            )}
          </span>
        )}
        <span className="ve-status-item">
          {t("{n} elements", { n: doc.elementCount })} · {t("total length {v} m", { v: Number(doc.totalLength.toPrecision(6)) })}
        </span>
      </div>
      <div className="ve-layout" style={{ height: layoutH }}>
        {view === "2d" ? (
          <LayoutView
            doc={doc}
            schema={schema}
            selected={selected}
            onSelect={(l) => onSelect(l, "layout")}
            run={show.run ? run.data : null}
            preview={show.preview ? pv : null}
            show={show}
            onDropElement={dropElement}
            readOnly={readOnly}
            fitSignal={fitSignal}
          />
        ) : (
          <Suspense fallback={<div className="empty-state"><Spinner size={24} /></div>}>
            <Beamline3D doc={doc} selected={selected} onSelect={(l) => onSelect(l, "3d")} envelope={envelope3d} theme={theme} />
          </Suspense>
        )}
      </div>
      <div className="sash sash-h" onMouseDown={startResize("y")} />
      <div className="ve-bottom" ref={bottomRef}>
        <div className="ve-outline" style={{ width: outlineW }}>
          <StructureTree
            doc={doc}
            kw={kw}
            selected={selected}
            compact
            onSelect={(l) => onSelect(l, "tree")}
            {...structureTreeHandlers(doc, lines, onRangeEdits, { readOnly, frequency, onShowText: showText ? undefined : () => onToggleText() })}
          />
        </div>
        <div className="sash sash-v" onMouseDown={startResize("x")} />
        <div className="ve-inspector">
          {st ? (
            <>
              <div className="ve-inspector-head">
                <div className="grow ellipsis">
                  <span className="kpi">{st.name || (st.key === "field" ? st.params[8] : "") || st.keyword}</span>
                  <span className="soft" style={{ marginLeft: 10 }}>
                    {kw.get(st.key) ? pick(kw.get(st.key)!.title) : st.keyword} · {t("line {n}", { n: st.line + 1 })}
                    {st.active && st.isElement ? ` · z = ${Number((st.zStart ?? 0).toPrecision(6))} … ${Number((st.zEnd ?? 0).toPrecision(6))} m` : ""}
                  </span>
                </div>
                <IconButton icon="arrow-up" tip={t("Move up (Alt+↑)")} disabled={readOnly} onClick={() => applyResult(moveUnit(doc, lines(), st.line, -1), onRangeEdits)} />
                <IconButton icon="arrow-down" tip={t("Move down (Alt+↓)")} disabled={readOnly} onClick={() => applyResult(moveUnit(doc, lines(), st.line, 1), onRangeEdits)} />
                <IconButton icon="copy" tip={t("Duplicate (Ctrl+D)")} disabled={readOnly} onClick={() => applyResult(duplicateUnit(doc, lines(), st.line), onRangeEdits)} />
                <IconButton icon="trash" tip={t("Delete (Del)")} disabled={readOnly} onClick={() => applyResult(deleteUnit(doc, lines(), st.line), onRangeEdits)} />
                <IconButton
                  icon="ellipsis"
                  tip={t("More")}
                  onClick={(e) => openMenuBelow(e.currentTarget, structureMenu(doc, lines, st.line, onRangeEdits, { readOnly, frequency, onShowText: showText ? undefined : onToggleText }))}
                />
              </div>
              <div className="ve-inspector-body">
                {st.isElement && (
                  <ComponentView st={st} kw={kw.get(st.key)} fieldDirs={fieldDirs} readOnly={readOnly} energy={energy} onDraft={onDraft} onCommit={onCommit} />
                )}
                <PropertyPanel st={st} kw={kw} readOnly={readOnly} fieldmaps={fieldmaps} onEdits={onEdits} />
              </div>
            </>
          ) : (
            <div className="property-empty muted">
              <Icon name="info" /> {t("Select a component in the layout or the outline. Drag components from the palette onto the beamline to add them.")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
