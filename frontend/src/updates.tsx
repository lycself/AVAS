import { useEffect } from "react";
import { create } from "zustand";
import { call, on } from "./bridge";
import { resolveUnsaved } from "./actions";
import { alertDialog, choiceDialog, reportError, toast } from "./components/overlays";
import { Button, Spinner } from "./components/ui";
import { UpdateProgress, type DownloadProgress } from "./components/UpdateProgress";
import { installPreparedUpdate, openUrl } from "./host";
import { t, useT } from "./i18n";
import "./styles/updates.css";

type Info = {
  current: { kind: string; version: string; commit: string };
  release: { version: string; commit: string; published: string; notes: string };
  available: boolean; ignored: boolean; canInstall: boolean;
};
type UpdateStatus = { phase: "idle" | "preparing" | "ready" | "installing"; commit: string; progress?: DownloadProgress | null };
const useUpdates = create<{ info: Info | null; busy: boolean; message: string; progress: DownloadProgress | null; hidden: string; status: UpdateStatus }>(() => ({
  info: null, busy: false, message: "", progress: null, hidden: "", status: { phase: "idle", commit: "" },
}));

on("updates.progress", (data: DownloadProgress) => useUpdates.setState({ message: data.message, progress: data }));

export async function checkUpdates() {
  if (useUpdates.getState().busy) return;
  const status = await call<UpdateStatus>("updates.status").catch(() => null);
  if (status && status.phase !== "idle") { useUpdates.setState({ status }); return; }
  await showUpdate();
}

async function resumePreparedUpdate() {
  useUpdates.setState({ busy: true });
  try {
    if (!(await resolveUnsaved(t("updating AVAS")))) return;
    await installPreparedUpdate();
  } catch (error) { reportError(error, t("AVAS update")); }
  finally { useUpdates.setState({ busy: false }); }
}

async function cancelPreparedUpdate() {
  try {
    await call("updates.cancel");
    useUpdates.setState({ status: { phase: "idle", commit: "" } });
  } catch (error) { reportError(error, t("AVAS update")); }
}

async function showUpdate() {
  if (useUpdates.getState().busy) return;
  useUpdates.setState({ busy: true, message: "Checking for updates...", progress: null });
  let prepared = false;
  try {
    let info = await call<Info>("updates.check", { force: true });
    useUpdates.setState({ info });
    while (info.available) {
      useUpdates.setState({ message: "" });
      const release = info.release;
      const message = `${t("Current version")}: ${info.current.version} · ${info.current.commit.slice(0, 8) || "—"}\n`
        + `${t("Available version")}: ${release.version} · ${release.commit.slice(0, 8)}\n${release.published}\n\n${t("What's new")}\n${release.notes}`
        + `\n\n${t("Even if you ignore this version, you can still get it from Help → Check for updates.")}`
        + (info.canInstall ? `\n\n${t("AVAS will close while the update is installed, then restart automatically. Please do not open it manually. The update window will stay visible.")}`
          : `\n\n${t("Update the server installation locally, then restart avas serve.")}`);
      const choice = await choiceDialog(message, [
        ...(info.canInstall ? [{ key: "install", label: t("Update and restart"), variant: "primary" as const }]
          : [{ key: "download", label: t("Open downloads"), variant: "primary" as const }]),
        { key: "ignore", label: t("Ignore this version") },
        { key: "later", label: t("Later") },
      ], { title: t("AVAS update") });
      if (choice === "ignore") {
        await call("updates.ignore", { commit: release.commit });
        useUpdates.setState({ info: { ...info, ignored: true } });
        return;
      }
      if (choice === "download") {
        openUrl(`https://github.com/lycself/AVAS/releases/tag/avas-${release.commit}`);
        return;
      }
      if (choice !== "install") { useUpdates.setState({ hidden: release.commit }); return; }
      useUpdates.setState({ message: "Preparing the confirmed update...", progress: null });
      const result = await call<{ changed: boolean; info?: Info }>("updates.prepare", { commit: release.commit });
      if (result.changed && result.info) {
        info = result.info;
        useUpdates.setState({ info });
        await alertDialog(t("A newer version is available. Review it before confirming."), { title: t("AVAS update") });
        continue;
      }
      prepared = true;
      if (!(await resolveUnsaved(t("updating AVAS")))) return;
      useUpdates.setState({ message: "Restarting to install the update...", progress: null });
      await installPreparedUpdate();
      prepared = false;
      return;
    }
    await alertDialog(t("This installation is already up to date."), { title: t("AVAS update") });
  } catch (error) {
    reportError(error, t("AVAS update"));
  } finally {
    if (prepared) await call("updates.cancel").catch(() => undefined);
    useUpdates.setState({ busy: false, message: "", progress: null });
  }
}

export function UpdateNotice() {
  const t = useT();
  const { info, busy, message, progress, hidden, status } = useUpdates();
  useEffect(() => {
    let stopped = false;
    const check = async () => {
      if (useUpdates.getState().busy) return;
      try {
        const info = await call<Info>("updates.check");
        if (!stopped) useUpdates.setState({ info });
      } catch { /* background failure is logged by the backend, never called up-to-date */ }
    };
    const timeout = window.setTimeout(check, 3000);
    const timer = window.setInterval(check, 6 * 3600 * 1000);
    const poll = async () => {
      try {
        const status = await call<UpdateStatus>("updates.status");
        if (!stopped) useUpdates.setState({ status,
          ...(status.phase === "preparing" && status.progress ? { progress: status.progress, message: status.progress.message } : {}),
        });
      } catch { /* reconnect on next poll */ }
    };
    poll();
    const statusTimer = window.setInterval(poll, 3000);
    call<{ ok: boolean; commit?: string; error?: string; log?: string; logAvailable?: boolean; details?: string } | null>("updates.result").then(result => {
      if (!result) return;
      if (result.ok) toast(t("AVAS was updated successfully."), "success");
      else alertDialog(`${t("The update failed. See the error details below.")}\n${t(result.error ?? "")}\n`
        + (result.logAvailable ? result.log : t("The update log is unavailable. You can copy the error details from this dialog.")),
        { title: t("AVAS update"), kind: "error", detail: result.details });
    }).catch(() => undefined);
    return () => { stopped = true; clearTimeout(timeout); clearInterval(timer); clearInterval(statusTimer); };
  }, []);
  if (!busy && status.phase !== "idle") return <div className="update-notice" role="status">
    {status.phase === "preparing" ? <UpdateProgress data={status.progress ?? { message: "Preparing the confirmed update...", stage: "prepare" }} />
      : <span>{status.phase === "ready" ? t("The confirmed update is ready to install.") : t("Restarting to install the update...")} {status.commit.slice(0, 8)}</span>}
    {status.phase === "ready" && <>
      <Button onClick={resumePreparedUpdate}>{t("Update and restart")}</Button>
      <Button onClick={cancelPreparedUpdate}>{t("Cancel")}</Button>
    </>}
  </div>;
  if ((busy && !message) || (!busy && (!info?.available || info.ignored || hidden === info.release.commit))) return null;
  return <div className="update-notice" role="status">
    {busy ? (progress ? <UpdateProgress data={progress} /> : <><Spinner size={14} /><span>{t(message)}</span></>) : <>
      <span>{t("An AVAS update is available.")} {info!.release.commit.slice(0, 8)}</span>
      <Button onClick={showUpdate}>{t("Review update")}</Button>
      <Button onClick={() => useUpdates.setState({ hidden: info!.release.commit })}>{t("Later")}</Button>
    </>}
  </div>;
}
