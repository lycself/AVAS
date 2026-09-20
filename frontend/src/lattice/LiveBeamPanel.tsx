// Run page: schematic of the beam in the running simulation.  A compact layout of
// the lattice the run uses with the envelope written so far, the bunch travelling
// to the current position and losses flashing where they happen, plus the numbers
// at the bunch.  After the run it keeps the final state and offers a replay.
// Shown for project runs, error studies, segment runs and the assistant's studies
// (drawn on their own candidate lattice).
// A run record chosen in the records list (store/live: openRecordReplay) takes the
// panel over: its lattice, its envelope and a replay, until it is closed or a new
// run starts.
import { useEffect, useMemo, useRef, useState } from "react";
import { call } from "../bridge";
import { Checkbox, Icon, IconButton, Spinner } from "../components/ui";
import { fmtG } from "../format";
import { useT } from "../i18n";
import { useApp } from "../store/app";
import { closeRecordReplay, lastFinite, useLive, type LiveLattice } from "../store/live";
import { stopReplay, startReplay, useBunchFrame, usePlayer, type Track } from "./bunchPlayer";
import { LayoutView, type EnvelopeCurves, type LayoutShow } from "./LayoutView";
import { PlayerBar } from "./PlayerBar";
import { loadSchema, type LatticeDoc, type Schema } from "./types";

const SHOW: LayoutShow = { run: false, preview: false, aperture: true, losses: true, max: false, energy: false, scale: "beam", band: true };
const ALL_KINDS: ("project" | "segment" | "assistant" | "scan")[] = ["project", "segment", "assistant", "scan"];
const COMPARE_KEY = "avas.live.compare";
const HEIGHT_KEY = "avas.live.height";
const MIN_HEIGHT = 240;
const MAX_HEIGHT = 1200;

function loadHeight(): number | null {
  try {
    const value = Number(localStorage.getItem(HEIGHT_KEY));
    return Number.isFinite(value) && value >= MIN_HEIGHT && value <= MAX_HEIGHT ? value : null;
  } catch {
    return null;
  }
}

function loadCompare(): boolean {
  try {
    return localStorage.getItem(COMPARE_KEY) === "1";
  } catch {
    return false;
  }
}

export function LiveBeamPanel() {
  const t = useT();
  const run = useLive((s) => s.run);
  const liveLattice = useLive((s) => s.lattice);
  const episode = useLive((s) => s.episode);
  const band = useLive((s) => s.band);
  const previous = useLive((s) => s.previous);
  const record = useLive((s) => s.record);
  const recordLoading = useLive((s) => s.recordLoading);
  const version = useLive((s) => s.version);
  const appRun = useApp((s) => s.run);
  const projectOpen = useApp((s) => s.project.open);
  const [schema, setSchema] = useState<Schema | null>(null);
  const [doc, setDoc] = useState<{ hash: string; doc: LatticeDoc } | null>(null);
  /** the run's lattice could not be parsed (the last good one stays on screen) */
  const [parseError, setParseError] = useState<string | null>(null);
  const [restMass, setRestMass] = useState<number | null>(null);
  const [compare, setCompareState] = useState<boolean>(loadCompare);
  const [preferredHeight, setPreferredHeight] = useState(320);
  const [height, setHeight] = useState<number | null>(loadHeight);
  const [maximized, setMaximized] = useState(false);
  const viewRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; height: number } | null>(null);
  const viewHeight = height ?? Math.min(720, preferredHeight);
  const saveHeight = (next: number | null) => {
    const value = next === null ? null : Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, next));
    setHeight(value);
    try {
      if (value === null) localStorage.removeItem(HEIGHT_KEY);
      else localStorage.setItem(HEIGHT_KEY, String(value));
    } catch { /* storage unavailable */ }
  };
  const frame = useBunchFrame(4);

  // a record replaces the live run in the panel (never while a run is in progress)
  const showRecord = !!record && !run?.running;
  const lattice: LiveLattice | null = showRecord ? record!.lattice : liveLattice;

  useEffect(() => {
    loadSchema().then(setSchema);
  }, []);

  useEffect(() => {
    if (!lattice || doc?.hash === lattice.hash) return;
    let alive = true;
    call<LatticeDoc>("lattice.parse", { text: lattice.text, fieldDirs: lattice.fieldDirs })
      .then((d) => {
        if (!alive) return;
        setDoc({ hash: lattice.hash, doc: d });
        setParseError(null);
      })
      .catch((e) => alive && setParseError(e?.message ?? String(e)));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lattice?.hash]);

  useEffect(() => {
    if (!projectOpen) return;
    call<{ form: Record<string, string> }>("beam.load")
      .then((b) => setRestMass(Number(b.form.particlerestmass) || null))
      .catch(() => setRestMass(null));
  }, [projectOpen, run?.id, record?.outputDir]);

  const setCompare = (v: boolean) => {
    setCompareState(v);
    try {
      localStorage.setItem(COMPARE_KEY, v ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  };

  const live = useMemo<EnvelopeCurves | null>(() => {
    if (showRecord) return record!.rows.z.length ? { ...record!.rows, losses: record!.losses } : null;
    return episode && episode.rows.z.length ? { ...episode.rows, losses: episode.losses } : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRecord, record, episode, version]);
  const track = useMemo<Track | null>(() => {
    if (showRecord) {
      const r = record!;
      return r.rows.z.length > 1 ? { ...r.rows, losses: r.losses, particles0: r.particles0 ?? r.rows.alive[0] } : null;
    }
    return !run?.running && episode && episode.rows.z.length > 1
      ? { ...episode.rows, losses: episode.losses, particles0: episode.particles0 ?? episode.rows.alive[0] }
      : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRecord, record, run?.running, episode, version]);

  // a record opened from the list starts playing at once (the button in the list is the request)
  const replayId = showRecord ? `record:${record!.outputDir}:${record!.started ?? ""}` : `live:${run?.id ?? ""}:${episode?.id ?? ""}`;
  const kind = showRecord ? (record!.kind === "segment" ? "segment" : "project") : run?.kind ?? "project";
  useEffect(() => {
    if (!showRecord || !track) return;
    if (usePlayer.getState().replay?.id === replayId) return;
    startReplay(replayId, recordLabel(record!, t), track, { restMass, kind });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRecord, record?.outputDir]);

  if (!run && !showRecord && !recordLoading) return null;

  const total = doc?.doc.totalLength ?? NaN;
  let task = "";
  if (showRecord) task = recordLabel(record!, t);
  else if (run) {
    task = run.kind === "segment" ? t("Segment {label}", { label: run.label }) : run.kind === "assistant" ? t("Assistant: {task}", { task: t(run.label) }) : run.kind === "scan" ? t("Parameter scan: {task}", { task: run.label }) : t("Full lattice");
    if (episode?.stageLabel && run.kind === "segment") task += ` · ${t("stage {i} of {n}: {label}", { i: episode.index ?? "?", n: episode.total ?? "?", label: t(episode.stageLabel) })}`;
    else if ((run.kind === "assistant" || run.kind === "scan") && episode?.index) task += ` · ${t("simulation {i} of {n}", { i: episode.index, n: episode.total ?? "?" })}`;
    else if (run.mode && run.mode !== "basic" && episode?.index) task += ` · ${t("error seed {i} of {n}", { i: episode.index, n: episode.total ?? "?" })}`;
  }

  const running = !showRecord && !!run?.running;
  const particles0 = frame?.particles0 ?? (showRecord ? record!.particles0 : episode?.particles0) ?? NaN;
  const alive = frame ? frame.alive : showRecord ? lastFinite(record!.rows.alive) : appRun.alive ?? NaN;
  const transmission = particles0 > 0 && Number.isFinite(alive) ? (100 * alive) / particles0 : NaN;
  const zOffset = showRecord ? record!.zOffset : episode?.zOffset ?? 0;
  const segmentRange: [number, number] | null = zOffset > 0 && live ? [zOffset, Math.max(zOffset, live.z[live.z.length - 1] ?? zOffset)] : null;
  const canCompare = !showRecord && run?.kind === "project" && !!previous;
  const noLattice = lattice === null && !running;
  const restMassFor = !showRecord && (run?.kind === "assistant" || run?.kind === "scan") ? null : restMass;

  return (
    <div className={`live-beam${maximized ? " maximized" : ""}`}>
      <div className="live-beam-head">
        <span className="live-beam-title">
          {running ? <span className="live-dot" /> : <Icon name="history" />}
          {showRecord ? t("Replay of a run record") : running ? t("Live beam") : t("Beam of the finished run")}
        </span>
        <span className="muted ellipsis grow">{recordLoading && !showRecord ? t("Loading the record…") : task}</span>
        {parseError && (
          <span className="warning-text" data-tip={parseError}>
            <Icon name="warning" /> {t("lattice not parsed")}
          </span>
        )}
        {canCompare && (
          <Checkbox checked={compare} onChange={setCompare} label={t("Compare with the run before")} tip={t("Show the run before as a grey reference while this one runs")} />
        )}
        <span className="soft" data-tip={t("The bunch and its particles are drawn from the rms envelope written so far; they are not the simulated particle distribution.")}>
          <Icon name="info" /> {t("schematic")}
        </span>
        {!running && (
          <PlayerBar id={replayId} label={task} track={track} restMass={restMassFor} kind={kind} followKinds={ALL_KINDS} />
        )}
        {!maximized && <IconButton icon="refresh" tip={t("Automatic view height")} onClick={() => saveHeight(null)} />}
        <IconButton icon={maximized ? "screen-normal" : "screen-full"} tip={maximized ? t("Restore view") : t("Maximize view")} onClick={() => setMaximized(!maximized)} />
        {showRecord && <IconButton icon="arrow-left" tip={t("Back to the last run")} onClick={() => { setMaximized(false); stopReplay(); closeRecordReplay(); }} />}
      </div>
      <div className="live-beam-view" ref={viewRef} style={maximized ? undefined : { height: viewHeight }}>
        {schema && doc ? (
          <LayoutView
            doc={doc.doc}
            schema={schema}
            selected={null}
            run={null}
            preview={null}
            show={SHOW}
            live={live}
            liveLabel={showRecord ? task : running ? t("this run (running)") : t("this run")}
            liveVersion={version}
            previous={canCompare && compare ? (previous as EnvelopeCurves) : null}
            previousLabel={t("run of {date}", { date: previous?.started ?? "?" })}
            band={!showRecord && run?.kind === "project" ? band : undefined}
            bunchKinds={ALL_KINDS}
            bunchWhenDone
            compact
            onPreferredHeight={setPreferredHeight}
            range={segmentRange}
          />
        ) : (
          <div className="empty-state">{noLattice ? <span className="muted">{t("No lattice information for this run.")}</span> : <Spinner size={20} />}</div>
        )}
      </div>
      {!maximized && <div
        className="live-beam-resize"
        role="separator"
        aria-orientation="horizontal"
        aria-label={t("Resize beam view")}
        aria-valuemin={MIN_HEIGHT}
        aria-valuemax={MAX_HEIGHT}
        aria-valuenow={viewHeight}
        tabIndex={0}
        data-tip={t("Drag to resize; double-click for automatic height")}
        onDoubleClick={() => saveHeight(null)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowUp" && e.key !== "ArrowDown" && e.key !== "Home") return;
          e.preventDefault();
          saveHeight(e.key === "Home" ? null : viewHeight + (e.key === "ArrowUp" ? -20 : 20));
        }}
        onPointerDown={(e) => {
          if (e.button !== 0 || !viewRef.current) return;
          e.preventDefault();
          drag.current = { y: e.clientY, height: viewRef.current.getBoundingClientRect().height };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current) saveHeight(drag.current.height + e.clientY - drag.current.y);
        }}
        onPointerUp={(e) => { drag.current = null; e.currentTarget.releasePointerCapture(e.pointerId); }}
        onPointerCancel={() => { drag.current = null; }}
        onLostPointerCapture={() => { drag.current = null; }}
      />}
      <div className="stats live-beam-stats">
        <div className="stat">
          <span className="caption">{t("Bunch at")}</span>
          <span className="kpi">
            {frame ? `${fmtG(frame.z, 5)} m` : "–"}
            {Number.isFinite(total) && <span className="soft"> / {fmtG(total, 5)} m</span>}
          </span>
        </div>
        <div className="stat">
          <span className="caption">{t("Macro-particles")}</span>
          <span className="kpi">{Number.isFinite(alive) ? `${Math.round(alive)} / ${Number.isFinite(particles0) ? Math.round(particles0) : "?"}` : "–"}</span>
        </div>
        <div className="stat">
          <span className="caption">{t("Transmission")}</span>
          <span className={transmission < 99.95 ? "kpi warning-text" : "kpi"}>{Number.isFinite(transmission) ? `${fmtG(transmission, 5)} %` : "–"}</span>
        </div>
        <div className="stat">
          <span className="caption">{t("Energy")}</span>
          <span className="kpi">{frame && Number.isFinite(frame.energy) ? `${fmtG(frame.energy, 6)} MeV` : "–"}</span>
        </div>
        <div className="stat">
          <span className="caption">{t("rms x / y")}</span>
          <span className="kpi">{frame && Number.isFinite(frame.rmsX) ? `${fmtG(frame.rmsX, 4)} / ${fmtG(frame.rmsY, 4)} mm` : "–"}</span>
        </div>
      </div>
    </div>
  );
}

function recordLabel(r: { kind: string; label: string; started: string | null }, t: (s: string, a?: Record<string, string | number>) => string): string {
  const label = r.kind === "segment" ? t("Segment {label}", { label: r.label }) : r.kind === "project" ? `${t("Full lattice")} (OutputFile)` : r.label;
  return r.started ? t("record {label} · {date}", { label, date: r.started }) : t("record {label}", { label });
}
