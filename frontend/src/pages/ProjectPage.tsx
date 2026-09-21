// Project page: a welcome screen while no project is open, the project overview
// once one is.  Opening / creating / switching projects also lives in the File
// menu and in the project switcher (status bar, title bar).
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { closeProject, newProject, openProject, projectMenuItems, revealProject, runSimulation } from "../actions";
import { call, on } from "../bridge";
import { openPath } from "../host";
import { openMenuBelow, reportError } from "../components/overlays";
import { Badge, Button, cx, Icon, IconButton, Spinner } from "../components/ui";
import { fmtG, fmtSeconds, runStatusLabel } from "../format";
import { pick, useT } from "../i18n";
import { showLog } from "../shell/LogPanel";
import { setPage, setProject, useApp, type PageId, type ProjectSummary, type RunInfo } from "../store/app";
import { setLatticeMode } from "../store/latticeUi";
import { basename } from "../util";
import { VersionStamp } from "../components/VersionStamp";

function parentDir(p: string) {
  return p.split(/[\\/]/).slice(0, -1).join("\\");
}

export default function ProjectPage() {
  const open = useApp((s) => s.project.open);
  return open ? <Overview /> : <Welcome />;
}

/* ------------------------------------------------------------------ welcome */
function Welcome() {
  const t = useT();
  const recent = useApp((s) => s.project.recent);
  return (
    <div className="page">
      <div className="welcome">
        <div className="welcome-hero">
          <div className="welcome-logo">
            <Icon name="circuit-board" />
          </div>
          <div>
            <h1 className="welcome-title">AVAS</h1>
            <div className="welcome-sub">
              Advanced Virtual Accelerator Software
            </div>
            <div className="welcome-sub"><VersionStamp /></div>
          </div>
        </div>
        <div className="welcome-columns">
          <section>
            <h3 className="welcome-h">{t("Start")}</h3>
            <button className="welcome-action primary" onClick={newProject}>
              <Icon name="new-folder" />
              <span className="grow">
                <span className="welcome-action-title">{t("New project...")}</span>
                <span className="welcome-action-desc">{t("Create a folder with InputFile/ and OutputFile/ and default input files")}</span>
              </span>
              <kbd className="kbd">Ctrl+N</kbd>
            </button>
            <button className="welcome-action" onClick={() => openProject()}>
              <Icon name="folder-opened" />
              <span className="grow">
                <span className="welcome-action-title">{t("Open project...")}</span>
                <span className="welcome-action-desc">{t("Choose a folder that contains InputFile/")}</span>
              </span>
              <kbd className="kbd">Ctrl+O</kbd>
            </button>
            <p className="hint welcome-note">{t("An AVAS project is a directory with InputFile/ (beam, lattice, settings) and OutputFile/ (results).")}</p>
          </section>
          <section>
            <h3 className="welcome-h">{t("Recent projects")}</h3>
            {recent.length === 0 ? (
              <p className="muted">{t("No recent projects")}</p>
            ) : (
              <div className="recent-list">
                {recent.map((p) => (
                  <div key={p} className="recent-row" data-tip={p} onClick={() => openProject(p)}>
                    <Icon name="folder" />
                    <span className="recent-name">{basename(p)}</span>
                    <span className="recent-path ellipsis grow">{parentDir(p)}</span>
                    <IconButton
                      icon="close"
                      className="recent-remove"
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
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ overview */
type Diagnostics = {
  rows: number;
  messages: { level: "info" | "warning" | "error"; text: [string, string] }[];
  particlesStart?: number | null;
  particlesEnd?: number | null;
  energyStart?: number | null;
  energyEnd?: number | null;
  transmission?: number | null;
  singleParticle?: boolean;
};

type Overview = ProjectSummary & {
  beam: Record<string, any> & { exists: boolean; error?: string };
  lattice: { name: string; exists: boolean; elements?: number; length?: number; rf?: number; issues?: number; errors?: number; counts?: Record<string, number> };
  settings: Record<string, any>;
  lastRun: RunInfo & { diagnostics?: Diagnostics; hint?: [string, string] };
};

const COUNT_LABELS: Record<string, string> = {
  drift: "drift",
  quad: "quadrupole",
  solenoid: "solenoid",
  bend: "dipole",
  edge: "dipole edge",
  steerer: "steerer",
  field1: "RF field map",
  field2: "static E field map",
  field3: "static B field map",
};

const FILE_PAGE: Record<string, PageId> = { "beam.txt": "beam", "input.txt": "settings", "ini.ini": "settings" };

function Overview() {
  const t = useT();
  const project = useApp((s) => s.project);
  const page = useApp((s) => s.page);
  const running = useApp((s) => s.run.running);
  const lastFinished = useApp((s) => s.lastFinished);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const switchRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(() => {
    call<Overview>("project.overview")
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e?.message ?? String(e)));
  }, []);

  useEffect(() => {
    if (page === "project") load();
  }, [page, project.path, project.latticeName, lastFinished, load]);
  useEffect(() => on("project", () => useApp.getState().page === "project" && load()), [load]);

  if (error) return <div className="empty-state danger-text">{error}</div>;
  if (!data) return <div className="empty-state"><Spinner size={24} /></div>;

  const run = data.lastRun ?? {};
  const diag = run.diagnostics;
  const tone = run.status === "finished" ? "success" : run.status === "failed" ? "danger" : run.status === "running" ? "accent" : "neutral";
  const beam = data.beam;
  const lat = data.lattice;
  const st = data.settings;

  return (
    <div className="page">
      <div className="page-inner overview">
        <header className="ov-header">
          <div className="ov-icon">
            <Icon name="root-folder" />
          </div>
          <div className="grow">
            <h1 className="page-title">{data.name}</h1>
            <div className="soft selectable ellipsis" data-tip={data.path}>
              {data.path}
            </div>
          </div>
          <div className="page-actions">
            <Button variant="primary" icon="play" disabled={running} onClick={runSimulation}>
              {t("Run simulation")}
            </Button>
            <Button ref={switchRef} icon="arrow-swap" onClick={() => switchRef.current && openMenuBelow(switchRef.current, projectMenuItems())}>
              {t("Switch project")}
            </Button>
            <IconButton icon="folder" tip={t("Show in Explorer")} onClick={revealProject} />
            <IconButton icon="close" tip={t("Close project")} onClick={closeProject} />
          </div>
        </header>

        <div className="ov-grid">
          <Card
            title={t("Last run")}
            icon="history"
            className="ov-wide"
            actions={
              <>
                <a onClick={() => showLog("problems")}>{t("Show problems in the log")}</a>
                {data.outputFiles ? <a onClick={() => setPage("results")}>{t("Results")}</a> : null}
              </>
            }
          >
            {run.status ? (
              <div className="col" style={{ gap: 8 }}>
                <div className="row wrap" style={{ gap: 12 }}>
                  <Badge tone={tone}>{runStatusLabel(run.status)}</Badge>
                  <span>{run.started}</span>
                  <span className="muted">{run.mode || "basic"}</span>
                  {run.elapsed_s != null && <span className="muted">{fmtSeconds(run.elapsed_s)}</span>}
                </div>
                {run.error && <div className="danger-text selectable">{String(run.error)}</div>}
                {run.hint && (
                  <div className="ov-note">
                    <Icon name="lightbulb" /> <span>{pick(run.hint)}</span>
                  </div>
                )}
                {diag && (
                  <>
                    <div className="ov-stats">
                      <Stat label={t("Transmission")} value={diag.transmission != null ? `${fmtG(diag.transmission * 100, 5)} %` : "–"} />
                      <Stat label={t("Final energy")} value={diag.energyEnd != null ? `${fmtG(diag.energyEnd, 6)} MeV` : "–"} />
                      <Stat label={t("Macro-particles")} value={diag.particlesEnd != null ? `${fmtG(diag.particlesEnd, 8)} / ${fmtG(diag.particlesStart, 8)}` : "–"} />
                      <Stat label={t("Output steps")} value={String(diag.rows)} />
                    </div>
                    {diag.messages.map((m, i) => (
                      <div key={i} className={cx("ov-note", m.level === "error" ? "danger" : m.level === "warning" ? "warning" : "")}>
                        <Icon name={m.level === "error" ? "error" : m.level === "warning" ? "warning" : "info"} /> <span>{pick(m.text)}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <p className="muted">{t("no run recorded for this project")}</p>
            )}
          </Card>

          <Card title={t("Beam")} icon="pulse" actions={<a onClick={() => setPage("beam")}>{t("Edit")}</a>}>
            {!beam.exists ? (
              <p className="muted">{t("beam.txt is missing")}</p>
            ) : beam.error ? (
              <p className="danger-text">{beam.error}</p>
            ) : (
              <KV
                rows={[
                  [t("Particle"), `q = ${beam.numofcharge || "?"} · m = ${fmtNum(beam.particlerestmass)} MeV`],
                  [t("Kinetic energy"), `${fmtNum(beam.kneticenergy)} MeV`],
                  [t("Current"), `${fmtNum(beam.current)} mA`],
                  [t("Frequency"), beam.frequency ? `${fmtG(Number(beam.frequency) / 1e6, 6)} MHz` : "–"],
                  [t("Macro-particles"), beam.particlenumber || "–"],
                  [t("Initial distribution"), beam.use_dst ? `${t("from file")} ${beam.dst}` : `${beam.distribution_x} / ${beam.distribution_y}${beam.cw ? " · DC" : ""}`],
                ]}
              />
            )}
          </Card>

          <Card
            title={t("Lattice")}
            icon="list-ordered"
            actions={
              <>
                <a
                  onClick={() => {
                    setLatticeMode("visual");
                    setPage("lattice");
                  }}
                >
                  {t("Visual editor")}
                </a>
                <a
                  onClick={() => {
                    setLatticeMode("text");
                    setPage("lattice");
                  }}
                >
                  {t("Text editor")}
                </a>
              </>
            }
          >
            {!lat.exists ? (
              <p className="muted">{t("{name} is missing", { name: lat.name })}</p>
            ) : (
              <>
                <KV
                  rows={[
                    [t("File"), lat.name],
                    [t("Elements"), String(lat.elements ?? 0)],
                    [t("Total length"), `${fmtG(lat.length ?? 0, 6)} m`],
                    [t("RF cavities"), String(lat.rf ?? 0)],
                    [
                      t("Problems"),
                      lat.issues ? (
                        <span className={lat.errors ? "danger-text" : "warning-text"}>{t("{n} problems", { n: lat.issues })}</span>
                      ) : (
                        <span className="success-text">{t("none")}</span>
                      ),
                    ],
                  ]}
                />
                <div className="ov-chips">
                  {Object.entries(lat.counts ?? {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, n]) => (
                      <span key={k} className="ov-chip">
                        {t(COUNT_LABELS[k] ?? k)} <b>{n}</b>
                      </span>
                    ))}
                </div>
              </>
            )}
          </Card>

          <Card title={t("Simulation settings")} icon="settings-gear" actions={<a onClick={() => setPage("settings")}>{t("Edit")}</a>}>
            {st.error ? (
              <p className="danger-text">{st.error}</p>
            ) : (
              <KV
                rows={[
                  [t("Model"), st.sim_type === "env" ? t("envelope") : t("multi-particle")],
                  [t("Space charge"), st.spacecharge ? `${t("on")} · ${st.scmethod}` : t("off")],
                  [t("Steps per RF period"), st.steppercycle],
                  [t("Multithreading"), st.multithreading ? t("on") : t("off")],
                  [t("Error study"), st.error_type ? st.error_type : t("off")],
                ]}
              />
            )}
          </Card>

          <Card title={t("Files")} icon="files" actions={<a onClick={() => setPage("files")}>{t("All files")}</a>}>
            <div className="ov-files">
              {data.inputs?.map((f) => (
                <button
                  key={f.name}
                  className={cx("ov-file", !f.exists && "missing")}
                  onClick={() => setPage(f.name === data.latticeName ? "lattice" : FILE_PAGE[f.name] ?? "files")}
                  data-tip={f.exists ? undefined : t("missing")}
                >
                  <Icon name={f.exists ? "pass" : "circle-slash"} className={f.exists ? "success-text" : "soft"} />
                  <span className="ellipsis">{f.name}</span>
                </button>
              ))}
            </div>
            <div className="row" style={{ marginTop: 10, gap: 12 }}>
              <span className="muted">
                {t("Output")}:{" "}
                {data.outputFiles || data.outputDirs ? t("{files} files, {dirs} folders", { files: data.outputFiles ?? 0, dirs: data.outputDirs ?? 0 }) : t("none yet")}
              </span>
              {data.outputDir && (
                <a onClick={() => openPath(data.outputDir).catch(reportError)}>{t("Open output folder")}</a>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function fmtNum(v: unknown) {
  return v === "" || v == null ? "–" : fmtG(Number(v), 7);
}

function Card({ title, icon, actions, children, className }: { title: ReactNode; icon: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("ov-card", className)}>
      <header className="ov-card-header">
        <Icon name={icon} />
        <h3>{title}</h3>
        <div className="ov-card-actions">{actions}</div>
      </header>
      {children}
    </section>
  );
}

function KV({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <div className="kv ov-kv">
      {rows.map(([k, v], i) => (
        <div key={i} style={{ display: "contents" }}>
          <div className="k">{k}</div>
          <div className="v">{v}</div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="caption">{label}</span>
      <span className="kpi">{value}</span>
    </div>
  );
}
