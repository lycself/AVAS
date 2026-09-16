import { useEffect } from "react";
import { call } from "../bridge";
import { closeProject, newProject, openProject } from "../actions";
import { reportError } from "../components/overlays";
import { Badge, Button, Icon, IconButton, Section } from "../components/ui";
import { runStatusLabel, fmtSeconds } from "../format";
import { useT } from "../i18n";
import { refreshProject, setProject, useApp, type ProjectSummary } from "../store/app";
import { PageHeader } from "./common";

function basename(p: string) {
  return p.split(/[\\/]/).filter(Boolean).pop() ?? p;
}

export default function ProjectPage() {
  const t = useT();
  const project = useApp((s) => s.project);
  const page = useApp((s) => s.page);
  useEffect(() => {
    if (page === "project") refreshProject().catch(() => undefined);
  }, [page]);
  const run = project.lastRun ?? {};
  const hasRun = !!run.status;
  const tone = run.status === "finished" ? "success" : run.status === "failed" ? "danger" : run.status === "running" ? "accent" : "neutral";

  return (
    <div className="page">
      <div className="page-inner">
        <PageHeader
          title={t("Project")}
          hint={t("An AVAS project is a directory with InputFile/ (beam, lattice, settings) and OutputFile/ (results).")}
        />
        <div className="columns">
          <div>
            <Section title={t("Start")} icon="rocket">
              <div className="row">
                <Button variant="primary" icon="new-folder" onClick={newProject}>
                  {t("New project...")}
                </Button>
                <Button icon="folder-opened" onClick={() => openProject()}>
                  {t("Open project...")}
                </Button>
              </div>
            </Section>
            <Section title={t("Recent projects")} icon="history">
              <div className="list" style={{ maxHeight: 360 }}>
                {project.recent.length === 0 && <div className="list-item muted">{t("No recent projects")}</div>}
                {project.recent.map((p) => (
                  <div
                    key={p}
                    className={`list-item ${project.path && p.toLowerCase() === project.path.toLowerCase() ? "active" : ""}`}
                    data-tip={p}
                    onClick={() => openProject(p)}
                  >
                    <Icon name="folder" />
                    <div className="grow">
                      <div>{basename(p)}</div>
                      <div className="recent-path">{p}</div>
                    </div>
                    <IconButton
                      icon="close"
                      tip={t("Remove from list")}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          setProject(await call<ProjectSummary>("project.removeRecent", { path: p }));
                        } catch (err) {
                          reportError(err);
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
              <p className="hint">{t("Click to open")}</p>
            </Section>
          </div>
          <div>
            <Section
              title={t("Current project")}
              icon="root-folder"
              actions={
                project.open && (
                  <>
                    <Button small icon="folder" onClick={() => call("shell.open", { path: project.path }).catch(reportError)}>
                      {t("Open folder")}
                    </Button>
                    <Button small variant="ghost" onClick={closeProject}>
                      {t("Close project")}
                    </Button>
                  </>
                )
              }
            >
              {!project.open ? (
                <p className="muted">{t("No project is open.")}</p>
              ) : (
                <div className="kv">
                  <div className="k">{t("Path")}</div>
                  <div className="v">{project.path}</div>
                  <div className="k">{t("Input files")}</div>
                  <div className="v">
                    <div className="check-list">
                      {project.inputs?.map((f) => (
                        <span key={f.name} className={f.exists ? "" : "soft"}>
                          <Icon name={f.exists ? "pass" : "circle-slash"} className={f.exists ? "success-text" : "soft"} />
                          {f.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="k">{t("Lattice used for the run")}</div>
                  <div className="v">{project.latticeName}</div>
                  <div className="k">{t("Output files")}</div>
                  <div className="v">
                    {project.outputFiles || project.outputDirs
                      ? t("{files} files, {dirs} folders", { files: project.outputFiles ?? 0, dirs: project.outputDirs ?? 0 })
                      : t("none yet")}
                  </div>
                  <div className="k">{t("Last run")}</div>
                  <div className="v">
                    {hasRun ? (
                      <div className="row wrap">
                        <Badge tone={tone}>{runStatusLabel(run.status)}</Badge>
                        <span>{run.started}</span>
                        <span className="muted">{run.mode || "basic"}</span>
                        {run.elapsed_s != null && <span className="muted">{fmtSeconds(run.elapsed_s)}</span>}
                        {run.error && <span className="danger-text">{String(run.error)}</span>}
                      </div>
                    ) : (
                      "–"
                    )}
                  </div>
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
