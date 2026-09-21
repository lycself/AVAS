import { useEffect } from "react";
import { flushSync } from "react-dom";
import { create } from "zustand";
import { call, on } from "./bridge";
import { resolveUnsaved } from "./actions";
import { alertDialog, reportError, toast } from "./components/overlays";
import { Button, Spinner } from "./components/ui";
import { UpdateProgress, type DownloadProgress } from "./components/UpdateProgress";
import { installPreparedUpdate, openUrl } from "./host";
import { t, useT } from "./i18n";
import { UpdatePanel } from "./components/UpdatePanel";
import "./styles/updates.css";

export type Info = {
  current: { kind: string; version: string; commit: string };
  release: { version: string; commit: string; published: string; notes: string };
  available: boolean; ignored: boolean; canInstall: boolean;
};
export type UpdateStatus = { phase: "idle" | "preparing" | "ready" | "installing"; commit: string; cancelling?: boolean; progress?: DownloadProgress | null };
const useUpdates = create<{ info: Info | null; open: boolean; reviewing: boolean; outcome: "" | "cancelled" | "failed"; busy: boolean; cancelRequested: boolean; message: string; progress: DownloadProgress | null; hidden: string; status: UpdateStatus }>(() => ({
  info: null, open: false, reviewing: false, outcome: "", busy: false, cancelRequested: false, message: "", progress: null, hidden: "", status: { phase: "idle", commit: "" },
}));
let resolveReview: ((choice: string) => void) | null = null;
let handingOff = false;
async function installWithPanel() {
  const previous = useUpdates.getState().status;
  handingOff = true;
  flushSync(() => useUpdates.setState({ open: true, progress: null, message: "Restarting to install the update...",
    status: { ...previous, phase: "installing", progress: null } }));
  try { await installPreparedUpdate(); }
  catch (error) { useUpdates.setState({ status: previous }); throw error; }
  finally { handingOff = false; }
}
function chooseReview(choice: string) {
  const resolve = resolveReview;
  resolveReview = null;
  useUpdates.setState({ reviewing: false });
  resolve?.(choice);
}
function closePanel() {
  if (handingOff) return;
  if (useUpdates.getState().reviewing) chooseReview("later");
  useUpdates.setState({ open: false });
}

on("updates.progress", (data: DownloadProgress) => {
  if (!handingOff) useUpdates.setState({ message: data.message, progress: data });
});

export async function checkUpdates() {
  useUpdates.setState({ open: true });
  if (useUpdates.getState().busy) return;
  const status = await call<UpdateStatus>("updates.status").catch(() => null);
  if (status && status.phase !== "idle") { useUpdates.setState({ status }); return; }
  await showUpdate();
}

async function resumePreparedUpdate() {
  useUpdates.setState({ busy: true, open: true, outcome: "" });
  try {
    if (!(await resolveUnsaved(t("updating AVAS")))) return;
    await installWithPanel();
  } catch (error) { reportError(error, t("AVAS update")); }
  finally { useUpdates.setState({ busy: false }); }
}

async function cancelPreparedUpdate() {
  useUpdates.setState({ cancelRequested: true });
  try {
    await call("updates.cancel");
    const status = await call<UpdateStatus>("updates.status");
    useUpdates.setState({ status, ...(status.phase === "idle" ? { outcome: "cancelled" as const, progress: null } : {}) });
  } catch (error) { useUpdates.setState({ cancelRequested: false }); reportError(error, t("AVAS update")); }
}

async function showUpdate() {
  if (useUpdates.getState().busy) return;
  useUpdates.setState({ busy: true, open: true, outcome: "", cancelRequested: false, message: "Checking for updates...", progress: null });
  let prepared = false;
  try {
    let info = await call<Info>("updates.check", { force: true });
    useUpdates.setState({ info });
    while (info.available) {
      useUpdates.setState({ message: "" });
      const release = info.release;
      const choice = await new Promise<string>((resolve) => {
        resolveReview = resolve;
        useUpdates.setState({ reviewing: true, open: true });
      });
      if (choice === "ignore") {
        await call("updates.ignore", { commit: release.commit });
        useUpdates.setState({ info: { ...info, ignored: true }, open: false });
        return;
      }
      if (choice === "download") {
        openUrl(`https://github.com/lycself/AVAS/releases/tag/avas-${release.commit}`);
        return;
      }
      if (choice !== "install") { useUpdates.setState({ hidden: release.commit, open: false }); return; }
      useUpdates.setState({ message: "Preparing the confirmed update...", progress: null });
      const result = await call<{ changed: boolean; cancelled?: boolean; info?: Info }>("updates.prepare", { commit: release.commit });
      if (result.cancelled || useUpdates.getState().cancelRequested) {
        useUpdates.setState({ outcome: "cancelled" });
        toast(t("Update cancelled. Downloaded data is kept for the next attempt."));
        return;
      }
      if (result.changed && result.info) {
        info = result.info;
        useUpdates.setState({ info });
        await alertDialog(t("A newer version is available. Review it before confirming."), { title: t("AVAS update") });
        continue;
      }
      prepared = true;
      if (!(await resolveUnsaved(t("updating AVAS")))) return;
      if (useUpdates.getState().cancelRequested) return;
      useUpdates.setState({ message: "Restarting to install the update...", progress: null });
      await installWithPanel();
      prepared = false;
      return;
    }
    await alertDialog(t("This installation is already up to date."), { title: t("AVAS update") });
  } catch (error) {
    useUpdates.setState({ outcome: "failed" });
    reportError(error, t("AVAS update"));
  } finally {
    if (prepared) await call("updates.cancel").catch(() => undefined);
    const status = await call<UpdateStatus>("updates.status").catch(() => ({ phase: "idle" as const, commit: "" }));
    useUpdates.setState({ busy: false, message: "", progress: null, status });
  }
}

export function UpdateNotice() {
  const t = useT();
  const { info, open, reviewing, outcome, busy, cancelRequested, message, progress, hidden, status } = useUpdates();
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
        if (!stopped && !handingOff) useUpdates.setState({ status,
          ...(useUpdates.getState().status.cancelling && status.phase === "idle" ? { outcome: "cancelled" as const } : {}),
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
  const panel = open && <UpdatePanel info={busy || status.phase === "idle" || info?.release.commit === status.commit ? info : null}
    status={status} progress={progress ?? status.progress ?? null} message={message} busy={busy} reviewing={reviewing}
    outcome={outcome} cancelling={!!status.cancelling || cancelRequested && status.phase === "preparing"}
    onClose={closePanel} onChoose={chooseReview} onCancel={cancelPreparedUpdate} onReview={showUpdate} onInstall={resumePreparedUpdate} />;
  if (open) return panel;
  if (!busy && status.phase !== "idle") return <div className="update-notice" role="status">
    {status.phase === "preparing" ? <UpdateProgress data={status.progress ?? { message: "Preparing the confirmed update...", stage: "prepare" }} />
      : <span>{status.phase === "ready" ? t("The confirmed update is ready to install.") : t("Restarting to install the update...")} {status.commit.slice(0, 8)}</span>}
    {status.phase === "ready" && <>
      <Button onClick={resumePreparedUpdate}>{t("Update and restart")}</Button>
      <Button onClick={cancelPreparedUpdate}>{t("Cancel")}</Button>
    </>}
    {status.phase === "preparing" && <Button disabled={status.cancelling || cancelRequested} onClick={cancelPreparedUpdate}>
      {status.cancelling || cancelRequested ? t("Cancelling update...") : t("Cancel update")}
    </Button>}
    <Button onClick={() => useUpdates.setState({ open: true })}>{t("Review update")}</Button>
  </div>;
  if ((busy && !message) || (!busy && (!info?.available || info.ignored || hidden === info.release.commit))) return null;
  return <div className="update-notice" role="status">
    {busy ? (progress ? <UpdateProgress data={progress} /> : <><Spinner size={14} /><span>{t(message)}</span></>) : <>
      <span>{t("An AVAS update is available.")} {info!.release.commit.slice(0, 8)}</span>
      <Button onClick={showUpdate}>{t("Review update")}</Button>
      <Button onClick={() => useUpdates.setState({ hidden: info!.release.commit })}>{t("Later")}</Button>
    </>}
    {busy && status.phase === "preparing" && <Button disabled={status.cancelling || cancelRequested} onClick={cancelPreparedUpdate}>
      {status.cancelling || cancelRequested ? t("Cancelling update...") : t("Cancel update")}
    </Button>}
    {busy && <Button onClick={() => useUpdates.setState({ open: true })}>{t("Review update")}</Button>}
  </div>;
}
