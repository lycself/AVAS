import { useEffect, useState } from "react";
import { pauseSimulation, resumeSimulation, runSimulation, stopSimulation } from "../actions";
import { call } from "../bridge";
import { reportError } from "../components/overlays";
import { Badge, Button, cx, ProgressBar, Section } from "../components/ui";
import { fmtSeconds, runStatusLabel } from "../format";
import { useT } from "../i18n";
import { LiveBeamPanel } from "../lattice/LiveBeamPanel";
import { setPage, showResults, useApp } from "../store/app";
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
  const info = project.lastRun ?? {};
  const tone = info.status === "finished" ? "success" : info.status === "failed" ? "danger" : info.status === "running" ? "accent" : "neutral";
  const effMode = running ? run.mode ?? mode : mode;
  // what the progress belongs to: the running job, or the one that finished last
  const job = running ? run : last;
  const source = job?.source ?? "project";
  const taskText =
    source === "segment"
      ? t("Segment {label}", { label: job?.label ?? "" })
      : source === "assistant"
        ? t("Assistant: {task}", { task: t(job?.label ?? "") })
        : t("Full lattice");
  const stageText = running && run.stages && run.stages > 1 ? `${run.stage} / ${run.stages}  ${t(run.stageLabel ?? "")}` : null;
  const stepText =
    run.step != null && run.all_step ? (source === "assistant" ? t("simulation {i} of {n}", { i: run.step, n: run.all_step }) : `${run.step} / ${run.all_step}`) : null;

  let engineLine = "";
  if (paused) engineLine = t("Paused. The simulation continues exactly where it stopped when you resume it.");
  else if (running) engineLine = run.line || t("waiting for the engine...");
  else if (last && !last.ok && !last.stopped) engineLine = last.message ?? "";

  return (
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
                  onClick={() => call("shell.open", { path: last.source === "segment" && last.outputDir ? last.outputDir : project.outputDir }).catch(reportError)}
                >
                  {t("Open output folder")}
                </Button>
              </div>
            )}
          </div>
        </Section>

        <Section title={t("Last run")} icon="history">
          {info.status ? (
            <div className="row wrap" style={{ gap: 12 }}>
              <Badge tone={tone}>{runStatusLabel(info.status)}</Badge>
              <span className="selectable">
                {[info.started, info.mode || "basic", info.elapsed_s != null ? fmtSeconds(info.elapsed_s) : null, info.error ? String(info.error) : null]
                  .filter(Boolean)
                  .join("   ·   ")}
              </span>
            </div>
          ) : (
            <p className="muted">{t("no run recorded for this project")}</p>
          )}
        </Section>
      </div>
    </div>
  );
}
