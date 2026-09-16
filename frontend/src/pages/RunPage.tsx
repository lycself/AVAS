import { useEffect, useState } from "react";
import { runSimulation, stopSimulation } from "../actions";
import { call } from "../bridge";
import { reportError } from "../components/overlays";
import { Badge, Button, cx, ProgressBar, Section } from "../components/ui";
import { fmtSeconds, runStatusLabel } from "../format";
import { useT } from "../i18n";
import { setPage, useApp } from "../store/app";
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

  const pct = run.percent ?? 0;
  let stateText = t("idle");
  let stateClass = "state-idle";
  if (run.running) {
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
  const showBar = run.running || (last && last.ok !== undefined);
  const info = project.lastRun ?? {};
  const tone = info.status === "finished" ? "success" : info.status === "failed" ? "danger" : info.status === "running" ? "accent" : "neutral";
  const effMode = run.running ? run.mode ?? mode : mode;

  return (
    <div className="page">
      <div className="page-inner">
        <PageHeader
          title={t("Run")}
          hint={t("All pages are saved and checked before the simulation starts. Results are written to OutputFile/ inside the project.")}
          actions={
            <>
              <Button variant="primary" icon="play" disabled={run.running} onClick={runSimulation} style={{ minWidth: 150 }}>
                {t("Run simulation")}
              </Button>
              <Button icon="debug-stop" disabled={!run.running} onClick={stopSimulation} className={run.running ? "btn-stop" : ""}>
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
          <div className="v">{project.outputDir}</div>
        </div>

        <Section title={t("Progress")} icon="pulse">
          <div className="col" style={{ gap: 10 }}>
            <div className="row">
              <span className={cx("state", stateClass)}>{stateText}</span>
              <div className="grow" />
              {showBar && <span className="kpi">{pct.toFixed(1)} %</span>}
            </div>
            <ProgressBar value={pct / 100} />
            <div className="stats">
              <div className="stat">
                <span className="caption">{t("Position")}</span>
                <span className="kpi">{run.pos_m != null ? `${run.pos_m.toFixed(3)} m` : "–"}</span>
              </div>
              <div className="stat">
                <span className="caption">{t("Step")}</span>
                <span className="kpi">{run.step != null && run.all_step ? `${run.step} / ${run.all_step}` : "–"}</span>
              </div>
              <div className="stat">
                <span className="caption">{t("Elapsed")}</span>
                <span className="kpi">{fmtSeconds(run.elapsed_s)}</span>
              </div>
              <div className="stat">
                <span className="caption">{t("Remaining")}</span>
                <span className="kpi">{run.running ? fmtSeconds(run.eta_s) : last?.ok ? "0 s" : "–"}</span>
              </div>
            </div>
            <div className="engine-line mono">
              {run.running ? run.line || t("waiting for the engine...") : last && !last.ok && !last.stopped ? last.message : ""}
            </div>
            {last?.ok && !run.running && (
              <div className="row">
                <Button icon="graph-line" onClick={() => setPage("results")}>
                  {t("Show results")}
                </Button>
                <Button variant="ghost" icon="folder" onClick={() => call("shell.open", { path: project.outputDir }).catch(reportError)}>
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
