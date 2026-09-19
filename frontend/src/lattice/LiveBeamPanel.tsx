// Run page: schematic of the beam in the running simulation.  A compact layout of
// the lattice the run uses with the envelope written so far, the bunch travelling
// to the current position and losses flashing where they happen, plus the numbers
// at the bunch.  After the run it keeps the final state and offers a replay.
// Shown for project runs, error studies, segment runs and the assistant's studies
// (drawn on their own candidate lattice).
import { useEffect, useMemo, useState } from "react";
import { call } from "../bridge";
import { Icon, Spinner } from "../components/ui";
import { fmtG } from "../format";
import { useT } from "../i18n";
import { useApp } from "../store/app";
import { useLive } from "../store/live";
import { useBunchFrame, type Track } from "./bunchPlayer";
import { LayoutView, type EnvelopeCurves, type LayoutShow } from "./LayoutView";
import { PlayerBar } from "./PlayerBar";
import { loadSchema, type LatticeDoc, type Schema } from "./types";

const SHOW: LayoutShow = { run: false, preview: false, aperture: true, losses: true, max: false, energy: false, scale: "beam", band: true };
const ALL_KINDS: ("project" | "segment" | "assistant" | "scan")[] = ["project", "segment", "assistant", "scan"];

export function LiveBeamPanel() {
  const t = useT();
  const run = useLive((s) => s.run);
  const lattice = useLive((s) => s.lattice);
  const episode = useLive((s) => s.episode);
  const band = useLive((s) => s.band);
  const previous = useLive((s) => s.previous);
  const version = useLive((s) => s.version);
  const appRun = useApp((s) => s.run);
  const projectOpen = useApp((s) => s.project.open);
  const [schema, setSchema] = useState<Schema | null>(null);
  const [doc, setDoc] = useState<{ hash: string; doc: LatticeDoc } | null>(null);
  /** the run's lattice could not be parsed (the last good one stays on screen) */
  const [parseError, setParseError] = useState<string | null>(null);
  const [restMass, setRestMass] = useState<number | null>(null);
  const frame = useBunchFrame(4);

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
  }, [projectOpen, run?.id]);

  const live = useMemo<EnvelopeCurves | null>(
    () => (episode && episode.rows.z.length ? { ...episode.rows, losses: episode.losses } : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [episode, version],
  );
  const track = useMemo<Track | null>(
    () =>
      !run?.running && episode && episode.rows.z.length > 1
        ? { ...episode.rows, losses: episode.losses, particles0: episode.particles0 ?? episode.rows.alive[0] }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run?.running, episode, version],
  );

  if (!run) return null;

  const total = doc?.doc.totalLength ?? NaN;
  let task = run.kind === "segment" ? t("Segment {label}", { label: run.label }) : run.kind === "assistant" ? t("Assistant: {task}", { task: t(run.label) }) : run.kind === "scan" ? t("Parameter scan: {task}", { task: run.label }) : t("Full lattice");
  if (episode?.stageLabel && run.kind === "segment") task += ` · ${t("stage {i} of {n}: {label}", { i: episode.index ?? "?", n: episode.total ?? "?", label: t(episode.stageLabel) })}`;
  else if ((run.kind === "assistant" || run.kind === "scan") && episode?.index) task += ` · ${t("simulation {i} of {n}", { i: episode.index, n: episode.total ?? "?" })}`;
  else if (run.mode && run.mode !== "basic" && episode?.index) task += ` · ${t("error seed {i} of {n}", { i: episode.index, n: episode.total ?? "?" })}`;

  const particles0 = frame?.particles0 ?? episode?.particles0 ?? NaN;
  const alive = frame ? frame.alive : appRun.alive ?? NaN;
  const transmission = particles0 > 0 && Number.isFinite(alive) ? (100 * alive) / particles0 : NaN;
  const segmentRange: [number, number] | null = episode && episode.zOffset > 0 && live ? [episode.zOffset, Math.max(episode.zOffset, live.z[live.z.length - 1] ?? episode.zOffset)] : null;

  return (
    <div className="live-beam">
      <div className="live-beam-head">
        <span className="live-beam-title">
          {run.running ? <span className="live-dot" /> : <Icon name="history" />}
          {run.running ? t("Live beam") : t("Beam of the finished run")}
        </span>
        <span className="muted ellipsis grow">{task}</span>
        {parseError && (
          <span className="warning-text" data-tip={parseError}>
            <Icon name="warning" /> {t("lattice not parsed")}
          </span>
        )}
        <span className="soft" data-tip={t("The bunch and its particles are drawn from the rms envelope written so far; they are not the simulated particle distribution.")}>
          <Icon name="info" /> {t("schematic")}
        </span>
        {!run.running && (
          <PlayerBar id={`live:${run.id}:${episode?.id ?? ""}`} label={task} track={track} restMass={run.kind === "assistant" || run.kind === "scan" ? null : restMass} kind={run.kind} />
        )}
      </div>
      <div className="live-beam-view">
        {schema && doc ? (
          <LayoutView
            doc={doc.doc}
            schema={schema}
            selected={null}
            run={null}
            preview={null}
            show={SHOW}
            live={live}
            liveLabel={run.running ? t("this run (running)") : t("this run")}
            liveVersion={version}
            previous={run.kind === "project" && previous ? (previous as EnvelopeCurves) : null}
            previousLabel={t("run of {date}", { date: previous?.started ?? "?" })}
            band={run.kind === "project" ? band : undefined}
            bunchKinds={ALL_KINDS}
            bunchWhenDone
            compact
            range={segmentRange}
          />
        ) : (
          <div className="empty-state">{lattice === null && !run.running ? <span className="muted">{t("No lattice information for this run.")}</span> : <Spinner size={20} />}</div>
        )}
      </div>
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
