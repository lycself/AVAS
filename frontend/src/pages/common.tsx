import type { ReactNode } from "react";
import { Empty, Icon } from "../components/ui";
import { useT } from "../i18n";
import { setPage, useApp, useInputsLocked } from "../store/app";
import { openProject, newProject, stopSimulation } from "../actions";
import { Button } from "../components/ui";

/** Notice on the input pages while a run locks the input files. */
export function RunLockBanner() {
  const t = useT();
  const locked = useInputsLocked();
  const paused = useApp((s) => !!s.run.paused);
  if (!locked) return null;
  return (
    <div className="run-lock-banner" role="status">
      <Icon name="lock" />
      <span className="grow">
        {paused
          ? t("The simulation is paused: the input files stay locked until it finishes or is stopped.")
          : t("A simulation is running: the input files are locked until it finishes or is stopped.")}
      </span>
      <Button small variant="ghost" icon="pulse" onClick={() => setPage("run")}>
        {t("Show progress")}
      </Button>
      <Button small icon="debug-stop" onClick={stopSimulation}>
        {t("Stop the run")}
      </Button>
    </div>
  );
}

export function PageHeader({ title, hint, actions }: { title: ReactNode; hint?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div className="page-header-text">
        <h1 className="page-title">{title}</h1>
        {hint && <p className="page-hint">{hint}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

/** Shown by pages that need an open project. */
export function NoProject() {
  const t = useT();
  return (
    <Empty icon="folder" title={t("No project is open")}>
      <p>{t("Open an AVAS project directory or create a new one.")}</p>
      <div className="row" style={{ justifyContent: "center", marginTop: 12 }}>
        <Button variant="primary" icon="new-folder" onClick={newProject}>
          {t("New project...")}
        </Button>
        <Button icon="folder-opened" onClick={() => openProject()}>
          {t("Open project...")}
        </Button>
      </div>
    </Empty>
  );
}

export function useProjectOpen(): boolean {
  return useApp((s) => s.project.open);
}

export function FormRow({ label, children, unit, tip, top }: { label?: ReactNode; children: ReactNode; unit?: ReactNode; tip?: string; top?: boolean }) {
  return (
    <>
      <div className={top ? "form-label top" : "form-label"} data-tip={tip}>
        {label}
      </div>
      <div className="form-field" data-tip={label ? undefined : tip}>
        {children}
        {unit !== undefined && <span className="unit">{unit}</span>}
      </div>
    </>
  );
}
