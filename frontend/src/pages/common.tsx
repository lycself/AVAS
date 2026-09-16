import type { ReactNode } from "react";
import { Empty } from "../components/ui";
import { useT } from "../i18n";
import { useApp } from "../store/app";
import { openProject, newProject } from "../actions";
import { Button } from "../components/ui";

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
