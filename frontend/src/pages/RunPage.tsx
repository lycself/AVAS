import { useCallback, useEffect, useState } from "react";
import { archiveRun, deleteRunRecord, pauseSimulation, resumeSimulation, runSimulation, stopSimulation, type RunRecord } from "../actions";
import { call, on } from "../bridge";
import { openPath } from "../host";
import { reportError } from "../components/overlays";
import { Badge, Button, cx, IconButton, ProgressBar, Section } from "../components/ui";
import { fmtSeconds, runStatusLabel } from "../format";
import { useT } from "../i18n";
import { LiveBeamPanel } from "../lattice/LiveBeamPanel";
import { setPage, showResults, useApp } from "../store/app";
import { openRecordReplay } from "../store/live";
import { NoProject, PageHeader } from "./common";

const MODE_LABEL: Record<string, string> = {
  basic: "multi-particle",
  stat: "static errors",
  dyn: "dynamic errors",
  stat_dyn: "static + dynamic errors",
};

export default function RunPage() {
  const t = useT();
  const project = useApp((s) => s.project);
  const run = useApp((s) => s.run);
  const last = useApp((s) => s.lastFinished);
  const [mode, setMode] = useState<string>("");

  useEffect(() => {
    if (!project.open) return;
    call<any>("settings.load")
      .then((s) => setMode(s?.error?.error_type || "basic"))
      .catch(() => setMode(""));
  }, [project.open, project.path, run.running]);

  if (!project.open) return <NoProject />;

  const running = run.running;
  const paused = running && !!run.paused;
  const pct = run.percent ?? 0;
  let stateText = t("idle");
  let stateClass = "state-idle";
  if (paused) {
    stateText = t("paused");
    stateClass = "state-paused";
  } else if (running) {
    stateText = t("running");
    stateClass = "state-running";
  } else if (last && last.ok !== undefined) {
    if (last.ok) {
      stateText = t("finished");
      stateClass = "state-ok";
    } else if (last.stopped) {
      stateText = t("stopped");
    } else {
      stateText = t("failed");
      stateClass = "state-fail";
    }
  }
  const showBar = running || (last && last.ok !== undefined);
  const effMode = running ? run.mode ?? mode : mode;
  // what the progress belongs to: the running job, or the one that finished last
  const job = running ? run : last;
  const source = job?.source ?? "project";
  const taskText =
    source === "segment"
      ? t("Segment {label}", { label: job?.label ?? "" })
      : source === "assistant"
        ? t("Assistant: {task}", { task: t(job?.label ?? "") })
        : source === "scan"
          ? t("Parameter scan: {task}", { task: job?.label ?? "" })
          : t("Full lattice");
  const stageText = running && run.stages && run.stages > 1 ? `${run.stage} / ${run.stages}  ${t(run.stageLabel ?? "")}` : null;
  const stepText =
    run.step != null && run.all_step ? (source === "assistant" || source === "scan" ? t("simulation {i} of {n}", { i: run.step, n: run.all_step }) : `${run.step} / ${run.all_step}`) : null;

  let engineLine = "";
  if (paused) engineLine = t("Paused. The simulation continues exactly where it stopped when you resume it.");
  else if (running) engineLine = run.line || t("waiting for the engine...");
  else if (last && !last.ok && !last.stopped) engineLine = last.message ?? "";

  return (
    <div className="run-page-shell">
    <div className="page">
      <div className="page-inner">
        <PageHeader
          title={t("Run")}
          hint={t("All pages are saved and checked before the simulation starts. Results are written to OutputFile/ inside the project.")}
          actions={
            <>
              {!running ? (
                <Button variant="primary" icon="play" onClick={runSimulation} style={{ minWidth: 150 }}>
                  {t("Run simulation")}
                </Button>
              ) : paused ? (
                <Button variant="primary" icon="debug-continue" onClick={resumeSimulation} style={{ minWidth: 150 }} tip={t("Resume (F5)")}>
                  {t("Resume")}
                </Button>
              ) : (
                <Button variant="primary" icon="debug-pause" onClick={pauseSimulation} style={{ minWidth: 150 }} tip={t("Pause (F5)")}>
                  {t("Pause")}
                </Button>
              )}
              <Button icon="debug-stop" disabled={!running} onClick={stopSimulation} className={running ? "btn-stop" : ""}>
                {t("Stop")}
              </Button>
            </>
          }
        />
        <div className="kv" style={{ marginBottom: 24 }}>
          <div className="k">{t("Project")}</div>
          <div className="v">{project.path}</div>
          <div className="k">{t("Mode")}</div>
          <div className="v">
            {effMode ? t(MODE_LABEL[effMode] ?? effMode) : "–"}{" "}
            <a onClick={() => setPage("settings")}>{t("change")}</a>
          </div>
          <div className="k">{t("Lattice")}</div>
          <div className="v">{project.latticeName}</div>
          <div className="k">{t("Output")}</div>
          <div className="v selectable">{source === "segment" && job?.outputDir ? job.outputDir : project.outputDir}</div>
        </div>

        <Section title={t("Progress")} icon="pulse">
          <div className="col" style={{ gap: 10 }}>
            <div className="row">
              <span className={cx("state", stateClass)}>{stateText}</span>
              {job && source !== "project" && <span className="muted">{taskText}</span>}
              <div className="grow" />
              {showBar && <span className="kpi">{pct.toFixed(1)} %</span>}
            </div>
            <ProgressBar value={pct / 100} paused={paused} />
            <div className="stats">
              {stageText && (
                <div className="stat">
                  <span className="caption">{t("Stage")}</span>
                  <span className="kpi">{stageText}</span>
                </div>
              )}
              <div className="stat">
                <span className="caption">{t("Position")}</span>
                <span className="kpi">{run.pos_m != null ? `${run.pos_m.toFixed(3)} m` : "–"}</span>
              </div>
              <div className="stat">
                <span className="caption">{t("Step")}</span>
                <span className="kpi">{stepText ?? "–"}</span>
              </div>
              <div className="stat">
                <span className="caption">{t("Elapsed")}</span>
                <span className="kpi">{fmtSeconds(run.elapsed_s)}</span>
              </div>
              <div className="stat">
                <span className="caption">{t("Remaining")}</span>
                <span className="kpi">{running ? (paused ? t("paused") : fmtSeconds(run.eta_s)) : last?.ok ? "0 s" : "–"}</span>
              </div>
            </div>
            <div className="engine-line mono">{engineLine}</div>
            <LiveBeamPanel />
            {last?.ok && !running && last.source !== "assistant" && (
              <div className="row">
                <Button icon="graph-line" onClick={() => showResults(last.source === "segment" ? last.outputDir : undefined)}>
                  {t("Show results")}
                </Button>
                <Button
                  variant="ghost"
                  icon="folder"
                  onClick={() => openPath(last.source === "segment" && last.outputDir ? last.outputDir : project.outputDir).catch(reportError)}
                >
                  {t("Open output folder")}
                </Button>
              </div>
            )}
          </div>
        </Section>

        <RunRecords running={running} />
      </div>
    </div>
    </div>
  );
}

const ENTRY_SHORT: Record<string, string> = {
  beam: "beam.txt",
  dst: "particle file",
  segment: "from previous segment",
  upstream: "with upstream",
  twiss: "Twiss beam",
};

function statusTone(status?: string | null) {
  return status === "finished" ? "success" : status === "failed" ? "danger" : status === "running" ? "accent" : "neutral";
}

/** The project's full run and every segment run, each with show / open / delete. */
function RunRecords({ running }: { running: boolean }) {
  const t = useT();
  const project = useApp((s) => s.project);
  const lastFinished = useApp((s) => s.lastFinished);
  const [records, setRecords] = useState<RunRecord[]>([]);
  const info = project.lastRun ?? {};

  const load = useCallback(() => {
    call<RunRecord[]>("results.sources")
      .then(setRecords)
      .catch(() => setRecords([]));
  }, []);
  useEffect(() => {
    if (!project.open) return;
    load();
    return on("project", load); // a deleted record or a finished run changes the summary
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.open, project.path, lastFinished, running]);

  const remove = async (rec: RunRecord) => {
    if (await deleteRunRecord(rec)) load();
  };
  const keep = async () => {
    if (await archiveRun()) load();
  };
  const archived = typeof info.archived === "string" && records.some((r) => r.kind === "archived" && r.outputDir.toLowerCase() === (info.archived as string).toLowerCase());

  const projectDetails = [info.started, info.mode || (info.status ? "basic" : null), info.elapsed_s != null ? fmtSeconds(info.elapsed_s) : null, info.error ? String(info.error) : null]
    .filter(Boolean)
    .join("   ·   ");
  const outputCount = project.outputFiles ?? 0;

  return (
    <Section title={t("Run records")} icon="history" actions={<IconButton icon="refresh" tip={t("Refresh")} onClick={load} />}>
      <div className="run-records">
        {records.map((rec) => {
          const isProject = rec.kind === "project";
          const isArchived = rec.kind === "archived";
          const status = isProject ? info.status : rec.status;
          const details = isProject
            ? projectDetails
            : isArchived
              ? [rec.time, rec.mode, rec.elapsed_s != null ? fmtSeconds(rec.elapsed_s) : null, rec.archivedAt ? t("kept {time}", { time: rec.archivedAt }) : null].filter(Boolean).join("   ·   ")
              : [
                `z ${rec.zStart ?? "?"}–${rec.zEnd ?? "?"} m`,
                rec.entry ? t(ENTRY_SHORT[rec.entry] ?? rec.entry) : null,
                rec.rephased ? t("{n} cavities re-phased", { n: rec.rephased }) : null,
                rec.time,
              ]
                .filter(Boolean)
                .join("   ·   ");
          const empty = isProject && !status && !outputCount;
          return (
            <div className={cx("run-record", empty && "empty")} key={rec.outputDir}>
              <div className="run-record-status">{status ? <Badge tone={statusTone(status)}>{runStatusLabel(status)}</Badge> : null}</div>
              <div className="run-record-main">
                <div className="run-record-title">
                  {isProject ? `${t("Full lattice")} (OutputFile)` : isArchived ? rec.label : t("Segment {label}", { label: rec.label })}
                  {isProject && status === "finished" && !archived && !empty && (
                    <span className="muted"> · {t("not kept")}</span>
                  )}
                </div>
                <div className="run-record-sub selectable">{empty ? t("no run recorded for this project") : details}</div>
              </div>
              <div className="run-record-actions">
                <IconButton
                  icon="play-circle"
                  tip={running ? t("Cannot replay while a simulation is running") : status !== "finished" ? t("Only a finished run can be replayed") : t("Replay this record")}
                  disabled={running || status !== "finished" || empty}
                  onClick={() =>
                    openRecordReplay(rec.outputDir)
                      .then(() => document.querySelector(".live-beam")?.scrollIntoView({ behavior: "smooth", block: "nearest" }))
                      .catch(reportError)
                  }
                />
                {isProject && status === "finished" && !archived && (
                  <IconButton icon="archive" tip={running ? t("Cannot keep while a simulation is running") : t("Keep this run (copy to Runs/)")} disabled={running} onClick={keep} />
                )}
                <IconButton
                  icon="graph-line"
                  tip={t("Show results")}
                  disabled={status !== "finished"}
                  onClick={() => showResults(isProject ? undefined : rec.outputDir)}
                />
                <IconButton icon="folder" tip={t("Open output folder")} disabled={empty} onClick={() => openPath(rec.outputDir).catch(reportError)} />
                <IconButton
                  icon="trash"
                  className="run-record-delete"
                  tip={running ? t("Cannot delete while a simulation is running") : t("Move to recycle bin")}
                  disabled={running || empty}
                  onClick={() => remove(rec)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
