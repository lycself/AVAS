// Visual lattice editor: component palette, large layout (or 3D) view with the
// beam envelope, outline tree and the component inspector.  It edits the same
// text model as the text editor (kept mounted by LatticeEditor), so undo,
// saving and the dirty state work exactly as in the text mode.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { call } from "../bridge";
import { openMenu, openMenuBelow, reportError, toast } from "../components/overlays";
import { Button, cx, Icon, IconButton, Segmented, Spinner } from "../components/ui";
import { pick, useT } from "../i18n";
import { useApp } from "../store/app";
import { useLive } from "../store/live";
import type { Track } from "./bunchPlayer";
import { ComponentView, type Draft } from "./ComponentView";
import { PlayerBar } from "./PlayerBar";
import { LayoutView, PALETTE_MIME, type EnvelopeCurves, type LayoutShow } from "./LayoutView";
import { PropertyPanel, StructureTree, structureTreeHandlers } from "./StructureEditor";
import { applyResult, elementOptions, PALETTE, structureMenu, type ApplyRange } from "./structureMenu";
import { defaultLength, deleteUnit, duplicateUnit, insertAfter, insertAtZ, moveUnit, newElementText, type NewElementKind } from "./structureOps";
import { formatStatement, type Edit, type LatticeDoc, type Schema, type Statement } from "./types";
import { listSegmentResults, replaceLine, textFingerprint, useLinearPreview, useRunEnvelope, useSegmentEnvelope, type SegmentSource } from "./usePreview";

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
  /** browse: look only, "Edit" enters the edit state; locked: a run locks the input files */
  editState: "browse" | "edit" | "locked";
  dirty: boolean;
  onStartEdit: () => void;
  onFinishEdit: () => void;
  onSave?: () => Promise<void>;
  /** False when the opened file is not the lattice the run uses: run results (last run, live run, segments) belong to another lattice and are hidden. */
  runResults?: boolean;
  showText: boolean;
  onToggleText: () => void;
  onUndo: () => void;
  onRedo: () => void;
  /** The last parse failed with this message; *doc* is the previous good one. */
  parseError?: string | null;
};

// keys that change the lattice in the edit state; in the browse state they show a hint
function isEditKey(e: React.KeyboardEvent) {
  const key = e.key.toLowerCase();
  const mod = e.ctrlKey || e.metaKey;
  return e.key === "Delete" || (mod && (key === "z" || key === "y" || key === "d")) || (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown"));
}

// inspector targets that edit values (disabled outside the edit state)
const EDIT_TARGETS = "input, select, textarea, button, .cv-slider, .cv-handle, .check, .radio, .select, .form-field, svg";

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

const DEFAULT_SHOW: LayoutShow = { run: false, preview: true, aperture: true, losses: true, max: false, energy: false, scale: "beam", compare: false, band: true };

// the assistant's sandbox studies use their own lattices: only the Run page shows them
const BUNCH_KINDS: ("project" | "segment")[] = ["project", "segment"];
const NO_BUNCH: ("project" | "segment")[] = [];

function samePath(a: string | null | undefined, b: string | null | undefined) {
  return !!a && !!b && a.replace(/[\\/]+$/, "").toLowerCase() === b.replace(/[\\/]+$/, "").toLowerCase();
}

export function VisualEditor({ doc, schema, selected, onSelect, onEdits, onRangeEdits, getText, fieldDirs, fieldmaps, readOnly, editState, dirty, onStartEdit, onFinishEdit, onSave, runResults, showText, onToggleText, onUndo, onRedo, parseError }: Props) {
  const t = useT();
  const hintAt = useRef(0);
  const browseHint = () => {
    if (editState === "edit" || Date.now() - hintAt.current < 4000) return;
    hintAt.current = Date.now();
    toast(editState === "locked" ? t("A simulation is running: the input files are locked until it finishes or is stopped.") : t("Click “Edit” to change the lattice."), "info", 3000);
  };
  const theme = useApp((s) => s.resolvedTheme);
  const kw = useMemo(() => new Map(schema.lattice.map((k) => [k.key, k])), [schema]);
  // "avas.visual.show" (older versions) showed the last run by default; the setting keeps the rest
  const [show, setShowState] = useState<LayoutShow>(() => load("avas.visual.show.v2", { ...load("avas.visual.show", DEFAULT_SHOW), run: false }));
  const [view, setView] = useState<"2d" | "3d">(() => (localStorage.getItem("avas.visual.view") === "3d" ? "3d" : "2d"));
  const [spaceCharge, setSpaceCharge] = useState<boolean>(() => localStorage.getItem("avas.visual.sc") !== "0");
  const [layoutH, setLayoutH] = useState(() => Number(localStorage.getItem("avas.visual.layoutH")) || 380);
  const [outlineW, setOutlineW] = useState(() => Number(localStorage.getItem("avas.visual.outlineW")) || 380);
  const [fitSignal, setFitSignal] = useState(0);
  const [frequency, setFrequency] = useState<number | undefined>(undefined);
  const hostRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const setShow = (patch: Partial<LayoutShow>) =>
    setShowState((s) => {
      const next = { ...s, ...patch };
      save("avas.visual.show.v2", next);
      return next;
    });

  // run results belong to the lattice the run uses; another opened file shows none of them
  const runOn = show.run && runResults !== false;
  const bunchKinds = runResults !== false ? BUNCH_KINDS : NO_BUNCH; // the moving bunch belongs to the run lattice too
  const run = useRunEnvelope(runResults !== false); // loaded even while hidden: the replay bar needs it
  const preview = useLinearPreview({ enabled: show.preview, fieldDirs, spaceCharge });
  const drafting = useRef(false);

  // ---- the run in progress (project runs, error studies, segment runs of this project)
  const projectPath = useApp((s) => (s.project.open ? s.project.path : null));
  const percent = useApp((s) => s.run.percent);
  const lastFinished = useApp((s) => s.lastFinished);
  const liveRun = useLive((s) => s.run);
  const liveEpisode = useLive((s) => s.episode);
  const liveBand = useLive((s) => s.band);
  const livePrevious = useLive((s) => s.previous);
  const liveVersion = useLive((s) => s.version);
  const liveHere = runResults !== false && !!liveRun && liveRun.kind !== "assistant" && (!liveRun.project || samePath(liveRun.project, projectPath));
  const liveRunning = liveHere && liveRun!.running;
  const projectRunning = liveRunning && liveRun!.kind === "project";
  const live = useMemo<EnvelopeCurves | null>(
    () => (liveRunning && liveEpisode ? { ...liveEpisode.rows, losses: liveEpisode.losses } : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [liveRunning, liveEpisode, liveVersion],
  );
  let liveLabel = t("this run (running)");
  if (liveRun?.kind === "segment") liveLabel = t("segment {label} (running)", { label: liveRun.label });
  else if (liveRun?.mode && liveRun.mode !== "basic" && liveEpisode?.index) liveLabel = t("error seed {i} of {n} (running)", { i: liveEpisode.index, n: liveEpisode.total ?? "?" });
  // while a project run rewrites DataSet.txt the loaded last run becomes the grey reference
  const previousEnv = projectRunning
    ? ((livePrevious as EnvelopeCurves | null) ?? run.data)
    : liveHere && liveRun!.kind === "project" && show.compare
      ? (livePrevious as EnvelopeCurves | null)
      : null;
  const previousLabel = t("run of {date}", { date: (projectRunning ? livePrevious?.started ?? run.data?.started : livePrevious?.started) ?? "?" });
  const band = liveHere && liveRun!.kind === "project" && show.band ? liveBand : undefined;

  // ---- a segment run's result below the full lattice (the finished one is shown automatically)
  const [segmentSource, setSegmentSource] = useState<SegmentSource | null>(null);
  const segmentEnv = useSegmentEnvelope(runResults !== false ? segmentSource : null);
  useEffect(() => {
    if (lastFinished?.source !== "segment" || !lastFinished.ok || !lastFinished.outputDir) return;
    listSegmentResults()
      .then((list) => {
        const found = list.find((s) => samePath(s.outputDir, lastFinished.outputDir));
        if (found) setSegmentSource(found);
      })
      .catch(() => undefined);
  }, [lastFinished]);
  useEffect(() => setSegmentSource(null), [projectPath]);

  // ---- was the lattice changed since the last run?
  const [textHash, setTextHash] = useState<string | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      textFingerprint(getText()).then(setTextHash).catch(() => setTextHash(null));
    }, 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);
  const stale = !projectRunning && !!run.data?.latticeHash && !!textHash && run.data.latticeHash !== textHash;

  // replay of the last run
  const replayTrack = useMemo<Track | null>(() => {
    const d = run.data;
    if (!d || d.z.length < 2) return null;
    return { z: d.z, rmsX: d.rmsX, rmsY: d.rmsY, rmsZ: d.rmsZ, energy: d.energy, alive: d.alive, losses: d.losses, particles0: d.particles };
  }, [run.data]);

  const [restMass, setRestMass] = useState<number | null>(null);
  useEffect(() => {
    call<{ form: Record<string, string> }>("beam.load")
      .then((b) => {
        setFrequency(Number(b.form.frequency) || undefined);
        setRestMass(Number(b.form.particlerestmass) || null);
      })
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
    // Drag from the rendered size: a short window may shrink the preferred height.
    const base = axis === "y" ? layoutRef.current?.clientHeight ?? layoutH : outlineW;
    const total = axis === "y" ? base + (bottomRef.current?.clientHeight ?? 180) : bottomRef.current?.clientWidth ?? 1000;
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
      save(axis === "y" ? "avas.visual.layoutH" : "avas.visual.outlineW", Math.round(last));
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const pv = preview.data;
  // memoised: the 3D view rebuilds its envelope tube whenever this object changes
  // (while a run is in progress its growing envelope; rebuilt at most every 2 s)
  const live3dVersion = Math.floor(liveVersion / 2);
  const envelope3d = useMemo(
    () =>
      live && live.z.length > 1
        ? { z: Float64Array.from(live.z), x: Float64Array.from(live.rmsX), y: Float64Array.from(live.rmsY), label: liveLabel }
        : show.preview && pv
          ? { z: pv.z, x: pv.rms_x, y: pv.rms_y, label: t("linear preview") }
          : runOn && run.data
            ? { z: run.data.z, x: run.data.rmsX, y: run.data.rmsY, label: t("last run") }
            : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [show.preview, runOn, pv, run.data, !!live, live3dVersion],
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
        if (el.closest("input, textarea, select, .monaco-editor")) return;
        if (readOnly) {
          if (isEditKey(e)) browseHint();
          return;
        }
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
        {editState !== "edit" ? (
          <>
            <Button
              small
              icon="edit"
              disabled={editState === "locked"}
              onClick={onStartEdit}
              tip={editState === "locked" ? t("The input files are locked while a simulation runs") : t("Change the lattice: add, move and delete components, edit parameters")}
            >
              {t("Edit")}
            </Button>
            <span className="ve-mode-hint soft">
              <Icon name={editState === "locked" ? "lock" : "eye"} />
              {editState === "locked" ? t("Locked while a simulation runs") : t("Browsing: select, zoom and read values")}
            </span>
          </>
        ) : (
          <>
            <Button small variant="primary" icon="check" onClick={onFinishEdit} tip={t("Leave the edit state (unsaved changes are asked about)")}>
              {t("Done")}
            </Button>
            <Button small icon="save" disabled={!dirty} onClick={() => onSave?.().catch(reportError)} tip={t("Save the lattice file (Ctrl+S saves all pages)")}>
              {t("Save")}
            </Button>
            {dirty && <Icon name="circle-filled" className="ve-unsaved" title={t("Unsaved changes")} />}
            <div className="divider-v" />
            <IconButton icon="discard" tip={t("Undo (Ctrl+Z)")} onClick={onUndo} />
            <IconButton icon="redo" tip={t("Redo (Ctrl+Y)")} onClick={onRedo} />
            <div className="divider-v" />
          </>
        )}
        {editState === "edit" && (
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
        )}
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
          onClick={async (e) => {
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const segments = await listSegmentResults().catch(() => [] as SegmentSource[]);
            openMenu(
              [
                { type: "header", label: t("Envelope") },
                { label: t("Last run"), checked: show.run, onClick: () => setShow({ run: !show.run }) },
                { label: t("Linear preview"), checked: show.preview, onClick: () => setShow({ preview: !show.preview }) },
                { label: t("Space charge in the preview"), checked: spaceCharge, disabled: !show.preview, onClick: () => {
                  setSpaceCharge(!spaceCharge);
                  localStorage.setItem("avas.visual.sc", spaceCharge ? "0" : "1");
                } },
                { label: t("Maximum sizes"), checked: show.max, onClick: () => setShow({ max: !show.max }) },
                {
                  label: t("Compare with the run before"),
                  checked: !!show.compare,
                  disabled: !(liveHere && liveRun?.kind === "project" && livePrevious),
                  onClick: () => setShow({ compare: !show.compare }),
                },
                { label: t("Finished error seeds"), checked: show.band !== false, disabled: !liveBand.length || !liveHere, onClick: () => setShow({ band: show.band === false }) },
                {
                  label: t("Segment run result"),
                  disabled: !segments.length,
                  submenu: [
                    { label: t("None"), checked: !segmentSource, onClick: () => setSegmentSource(null) },
                    { type: "separator" as const },
                    ...segments.map((s) => ({
                      label: `${s.label}${s.time ? `  ·  ${s.time}` : ""}`,
                      checked: samePath(segmentSource?.outputDir, s.outputDir),
                      onClick: () => setSegmentSource(s),
                    })),
                  ],
                },
                { type: "separator" },
                { label: t("Pipe apertures"), checked: show.aperture, onClick: () => setShow({ aperture: !show.aperture }) },
                { label: t("Particle losses"), checked: show.losses, onClick: () => setShow({ losses: !show.losses }) },
                { label: t("Energy (right axis)"), checked: show.energy, onClick: () => setShow({ energy: !show.energy }) },
                { type: "separator" },
                { label: t("Vertical scale: beam"), checked: show.scale === "beam", onClick: () => setShow({ scale: "beam" }) },
                { label: t("Vertical scale: pipe"), checked: show.scale === "pipe", onClick: () => setShow({ scale: "pipe" }) },
              ],
              r.left,
              r.bottom + 2,
            );
          }}
        >
          {t("Overlays")}
        </Button>
        <IconButton icon="screen-full" tip={t("Fit the whole lattice (double-click the view)")} onClick={() => setFitSignal((n) => n + 1)} />
        <IconButton icon={showText ? "layout-sidebar-right" : "layout-sidebar-right-off"} tip={showText ? t("Hide the text") : t("Show the text next to the visual editor")} active={showText} onClick={onToggleText} />
      </div>
      <div className="ve-status soft">
        {parseError && (
          <span className="ve-status-item warning-text" data-tip={parseError}>
            <Icon name="warning" />
            {t("parse failed: the last good structure is shown")}
          </span>
        )}
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
        {liveRunning && (
          <span className="ve-status-item accent-text">
            <Icon name="pulse" />
            {t("{label} · {pct} %", { label: liveLabel, pct: (percent ?? 0).toFixed(1) })}
          </span>
        )}
        {runResults === false && (
          <span className="ve-status-item soft" data-tip={t("The last run, the run in progress and segment results belong to the lattice used for the run; they are shown when that file is opened.")}>
            <Icon name="info" />
            {t("not the lattice used for the run: no run results")}
          </span>
        )}
        {runOn && !projectRunning && (
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
        {stale && runOn && (
          <span className="ve-status-item warning-text" data-tip={t("The curves of the last run belong to the lattice as it was when that run started.")}>
            <Icon name="warning" />
            {t("lattice changed since the last run")}
          </span>
        )}
        {segmentEnv && (
          <span className="ve-status-item">
            <i className="lg-line" style={{ background: "var(--curve-segment)" }} />
            {t("segment {label}", { label: segmentEnv.label })}
            <IconButton icon="close" className="ve-status-close" tip={t("Hide the segment result")} onClick={() => setSegmentSource(null)} />
          </span>
        )}
        <span className="ve-status-item">
          {t("{n} elements", { n: doc.elementCount })} · {t("total length {v} m", { v: Number(doc.totalLength.toPrecision(6)) })}
        </span>
        <span className="grow" />
        {runResults !== false && !liveRunning && replayTrack && (
          <PlayerBar
            id={`lastrun:${run.data?.started ?? ""}`}
            label={t("last run")}
            track={replayTrack}
            restMass={restMass}
            kind="project"
            compact
            onStart={() => !show.run && setShow({ run: true })}
          />
        )}
      </div>
      <div className="ve-layout" ref={layoutRef} style={{ height: layoutH }}>
        {view === "2d" ? (
          <LayoutView
            doc={doc}
            schema={schema}
            selected={selected}
            onSelect={(l) => onSelect(l, "layout")}
            run={runOn && !projectRunning ? run.data : null}
            preview={show.preview ? pv : null}
            show={show}
            live={live}
            liveLabel={liveLabel}
            liveVersion={liveVersion}
            previous={runOn || projectRunning ? previousEnv : null}
            previousLabel={previousLabel}
            band={band}
            segment={segmentEnv}
            bunchKinds={bunchKinds}
            onDropElement={dropElement}
            readOnly={readOnly}
            fitSignal={fitSignal}
          />
        ) : (
          <Suspense fallback={<div className="empty-state"><Spinner size={24} /></div>}>
            <Beamline3D doc={doc} selected={selected} onSelect={(l) => onSelect(l, "3d")} envelope={envelope3d} theme={theme} bunchKinds={bunchKinds} />
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
        <div
          className="ve-inspector"
          onPointerDownCapture={(e) => {
            if (readOnly && st && (e.target as HTMLElement).closest(EDIT_TARGETS)) browseHint();
          }}
        >
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
