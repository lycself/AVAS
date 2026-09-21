import { FloatingWindow, fitRect, viewport } from "./FloatingWindow";
import { Button, Icon, Spinner } from "./ui";
import { UpdateProgress, type DownloadProgress } from "./UpdateProgress";
import { updateStep } from "./updatePhase";
import { useT } from "../i18n";
import type { Info, UpdateStatus } from "../updates";

export function UpdatePanel({ info, status, progress, message, busy, reviewing, outcome, cancelling,
  onClose, onChoose, onCancel, onReview, onInstall,
}: {
  info: Info | null; status: UpdateStatus; progress: DownloadProgress | null; message: string;
  busy: boolean; reviewing: boolean; outcome: "" | "cancelled" | "failed"; cancelling: boolean;
  onClose: () => void; onChoose: (choice: string) => void; onCancel: () => void;
  onReview: () => void; onInstall: () => void;
}) {
  const t = useT();
  const active = !reviewing && (busy || status.phase !== "idle");
  const step = updateStep(status.phase === "idle" && active ? "preparing" : status.phase, progress?.stage);
  const known = active && progress?.stage === "download" && progress.total != null && progress.total > 0;
  const percent = known ? Math.floor(Math.min(100, Math.max(0, (progress.downloaded ?? 0) / progress.total! * 100))) : null;
  const stages = [t("Download"), t("Verify"), t("Prepare"), t("Install"), t("Restart")];
  const title = cancelling ? t("Cancelling update...") : outcome === "cancelled" ? t("Update cancelled")
    : outcome === "failed" ? t("The update needs attention") : status.phase === "installing" ? t("Restarting to install the update...")
    : status.phase === "ready" ? t("The confirmed update is ready to install.")
    : active ? t("Preparing your update") : info?.available ? t("A new version is available") : t("AVAS update");
  return <FloatingWindow label={t("AVAS update")} title={<><span className="update-brand">AVAS</span> / {t("Software update")}</>}
    className="update-window" onClose={onClose} minSize={{ width: 340, height: 380 }} initialRect={() => {
      const v = viewport(); return fitRect({ x: (v.width - 680) / 2, y: (v.height - 610) / 2, width: 680, height: 610 }, { width: 340, height: 380 });
    }}>
    <div className="update-body">
      <div className="update-identity"><span>{t("Advanced Virtual Accelerator Software")}</span></div>
      <div className="update-hero"><div><h2 aria-live="polite">{title}</h2><p>{outcome === "cancelled"
        ? t("Update cancelled. Downloaded data is kept for the next attempt.")
        : outcome === "failed" ? t("Your download cache is kept. Review the error before trying again.")
        : t("The complete package is verified before installation.")}</p></div>
        {percent != null && <div className="update-percent" aria-label={t("Download progress")}>{percent}<span>%</span></div>}
      </div>
      {info && <div className="update-versions"><div><small>{t("Current version")}</small><span>{info.current.version} · {info.current.commit.slice(0, 8) || "—"}</span></div><Icon name="arrow-right" />
        <div><small>{t("Available version")}</small><span>{info.release.version} · {info.release.commit.slice(0, 8)}</span></div></div>}
      {info?.canInstall !== false && <ol className="update-steps" aria-label={t("Update stages")}>{stages.map((label, i) => <li key={label}
        className={active && i === step ? "active" : active && i < step ? "done" : ""} aria-current={active && i === step ? "step" : undefined}>
        <span className="update-node">{active && i < step ? <Icon name="check" /> : i + 1}</span><span>{label}</span></li>)}</ol>}
      {active && progress && <UpdateProgress data={progress} />}
      {active && !progress && <div className="update-wait"><Spinner size={14} /><span>{t(message || "Preparing the confirmed update...")}</span></div>}
      {info && <section className="update-notes"><div className="update-notes-heading"><h3>{t("What's new")}</h3><span>{info.release.published}</span></div><div className="update-release-notes">{info.release.notes}</div></section>}
      <div className="update-assurance"><Icon name="shield" /><span>{info?.canInstall === false ? t("Update the server installation locally, then restart avas serve.")
        : t("AVAS will close while the update is installed, then restart automatically. Please do not open it manually. The update window will stay visible.")}</span></div>
      {reviewing && <p className="update-ignore-note">{t("Even if you ignore this version, you can still get it from Help → Check for updates.")}</p>}
    </div>
    <footer className="update-footer"><span>{active ? t("Closing this panel keeps the update running.") : t("Review the release before updating.")}</span><div>
      {reviewing ? <><Button variant="ghost" onClick={() => onChoose("ignore")}>{t("Ignore this version")}</Button><Button onClick={() => onChoose("later")}>{t("Later")}</Button>
        <Button variant="primary" onClick={() => onChoose(info?.canInstall ? "install" : "download")}>{info?.canInstall ? t("Update and restart") : t("Open downloads")}</Button></>
        : status.phase === "preparing" ? <Button disabled={cancelling} onClick={onCancel}>{cancelling ? t("Cancelling update...") : t("Cancel update")}</Button>
        : !busy && status.phase === "ready" ? <><Button onClick={onCancel}>{t("Cancel update")}</Button><Button variant="primary" onClick={onInstall}>{t("Update and restart")}</Button></>
        : !busy && status.phase === "idle" ? <><Button onClick={onClose}>{t("Return to workspace")}</Button><Button variant="primary" onClick={onReview}>{outcome ? t("Try update again") : t("Review update")}</Button></>
        : status.phase === "installing" ? <span>{t("Installation has started and cannot be cancelled.")}</span> : null}
    </div></footer>
  </FloatingWindow>;
}
