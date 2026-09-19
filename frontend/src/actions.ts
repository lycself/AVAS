// Commands shared by the menu bar, tool bar, shortcuts and pages.
import { call, isDesktop, on } from "./bridge";
import { alertDialog, anyDialogOpen, choiceDialog, confirmDialog, reportError, toast, type MenuItem } from "./components/overlays";
import { canQuit, openPath, pickFolder, pickSaveFile } from "./host";
import { t } from "./i18n";
import { refreshProject, setPage, setProject, showStatus, useApp, type ProjectSummary } from "./store/app";
import { allPages, dirtyPages, useDirty } from "./store/pages";

/** Ask about unsaved pages.  Resolves true when it is fine to continue. */
export async function resolveUnsaved(action: string): Promise<boolean> {
  const dirty = dirtyPages();
  if (!dirty.length) return true;
  const names = dirty.map((p) => p.label()).join(", ");
  const choice = await choiceDialog(
    t("Save changes to {names} before {action}?", { names, action }),
    [
      { key: "save", label: t("Save"), variant: "primary" },
      { key: "discard", label: t("Don't save") },
      { key: "cancel", label: t("Cancel") },
    ],
    { title: t("Unsaved changes") },
  );
  if (choice === null || choice === "cancel") return false;
  if (choice === "save") return saveAll();
  return true;
}

export async function openProject(path?: string) {
  if (useApp.getState().run.running) {
    await alertDialog(t("Stop the running simulation first."), { title: t("Run") });
    return;
  }
  try {
    let target = path;
    if (!target) {
      const start = useApp.getState().project.lastDir ?? "";
      target = (await pickFolder({ directory: start, title: t("Open project") })) ?? undefined;
      if (!target) return;
    }
    if (!(await resolveUnsaved(t("opening another project")))) return;
    const summary = await call<ProjectSummary>("project.open", { path: target });
    setProject(summary);
    showStatus(t("Project opened"));
  } catch (e) {
    reportError(e, t("Open project"));
  }
}

export async function newProject() {
  if (useApp.getState().run.running) {
    await alertDialog(t("Stop the running simulation first."), { title: t("Run") });
    return;
  }
  try {
    const start = useApp.getState().project.lastDir ?? "";
    const target = await pickSaveFile({ directory: start, filename: "avas_project", title: t("New project") });
    if (!target) return;
    if (!(await resolveUnsaved(t("creating a project")))) return;
    const summary = await call<ProjectSummary>("project.create", { path: target });
    setProject(summary);
    setPage("beam");
    toast(t("Project created"), "success");
  } catch (e) {
    reportError(e, t("New project"));
  }
}

export async function closeProject() {
  if (!(await resolveUnsaved(t("closing the project")))) return;
  try {
    setProject(await call<ProjectSummary>("project.close"));
    setPage("project");
  } catch (e) {
    reportError(e, t("Close project"));
  }
}

export function revealProject() {
  const path = useApp.getState().project.path;
  if (path) openPath(path).catch((e) => reportError(e));
}

function basename(p: string) {
  return p.split(/[\\/]/).filter(Boolean).pop() ?? p;
}

/** Project switcher: recent projects plus open / new / close (status bar, title, overview page). */
export function projectMenuItems(): MenuItem[] {
  const { project } = useApp.getState();
  const current = project.path?.toLowerCase();
  const recent = project.recent.filter((p) => p.toLowerCase() !== current).slice(0, 8);
  const items: MenuItem[] = [];
  if (project.open) {
    items.push({ type: "header", label: project.name ?? "" });
    items.push({ label: t("Project overview"), icon: "home", onClick: () => setPage("project") });
    items.push({ label: t("Show in Explorer"), icon: "folder", onClick: revealProject });
    items.push({ type: "separator" });
  }
  if (recent.length) {
    items.push({ type: "header", label: t("Switch to") });
    for (const p of recent) items.push({ label: basename(p), shortcut: shortPath(p), icon: "folder", onClick: () => openProject(p) });
    items.push({ type: "separator" });
  }
  items.push({ label: t("Open project..."), shortcut: "Ctrl+O", icon: "folder-opened", onClick: () => openProject() });
  items.push({ label: t("New project..."), shortcut: "Ctrl+N", icon: "new-folder", onClick: newProject });
  if (project.open) items.push({ label: t("Close project"), icon: "close", onClick: closeProject });
  return items;
}

function shortPath(p: string) {
  const parent = p.split(/[\\/]/).slice(0, -1).join("\\");
  return parent.length > 42 ? "…" + parent.slice(-40) : parent;
}

let saving = false;
/** Save every page with unsaved changes (Ctrl+S). */
export async function saveAll(quiet = false): Promise<boolean> {
  if (!useApp.getState().project.open || saving) return false;
  saving = true;
  try {
    const dirty = dirtyPages();
    for (const page of dirty) await page.save();
    if (!quiet) showStatus(dirty.length ? t("Project saved") : t("Nothing to save"));
    await refreshProject();
    return true;
  } catch (e) {
    reportError(e, t("Save"));
    return false;
  } finally {
    saving = false;
  }
}

/** Validate the pages, save them and run the engine's checks (shows what went wrong). */
export async function prepareRun(): Promise<{ ok: boolean; error?: string }> {
  const errors = allPages().flatMap((p) => p.validate?.() ?? []);
  if (errors.length) {
    await alertDialog(errors.join("\n"), { title: t("Cannot run"), kind: "warning" });
    return { ok: false, error: errors.join("; ") };
  }
  if (!(await saveAll(true))) return { ok: false, error: "The pages could not be saved." };
  try {
    await call("run.check");
  } catch (e: any) {
    await reportError(e, t("Project check"));
    return { ok: false, error: e?.message ?? String(e) };
  }
  return { ok: true };
}

export async function runSimulation() {
  const app = useApp.getState();
  if (!app.project.open || app.run.running) return;
  if (!(await prepareRun()).ok) return;
  try {
    const state = await call<any>("run.start");
    useApp.setState({ run: state });
    setPage("run");
  } catch (e) {
    reportError(e, t("Run"));
  }
}

export async function stopSimulation() {
  try {
    await call("run.stop");
  } catch (e) {
    reportError(e, t("Stop"));
  }
}

export async function pauseSimulation() {
  if (!useApp.getState().run.running) return;
  try {
    useApp.setState({ run: await call<any>("run.pause") });
  } catch (e) {
    reportError(e, t("Pause"));
  }
}

export async function resumeSimulation() {
  if (!useApp.getState().run.running) return;
  try {
    useApp.setState({ run: await call<any>("run.resume") });
  } catch (e) {
    reportError(e, t("Resume"));
  }
}

/** F5 and the tool-bar button: run, pause or resume depending on the state. */
export function runPauseResume() {
  const { run } = useApp.getState();
  if (!run.running) runSimulation();
  else if (run.paused) resumeSimulation();
  else pauseSimulation();
}

export async function showAbout() {
  const { version } = useApp.getState();
  let lines: string[] = [];
  try {
    const info = await call<any>("app.info");
    const b = info.build ?? {};
    lines = [
      b.frozen ? t("Stand-alone build") : t("Running from source"),
      b.built ? `${t("Built")}: ${b.built}` : b.frontend ? `${t("Front end built")}: ${b.frontend}` : "",
      b.commit ? `${t("Commit")}: ${b.commit}${b.dirty ? ` (${t("with local changes")})` : ""}` : "",
      `${t("Location")}: ${b.location ?? ""}`,
      `Python ${info.python} · WebView2 ${info.webview2 ?? "–"}`,
    ].filter(Boolean);
  } catch {
    /* the dialog still shows the version */
  }
  alertDialog(
    `AVAS ${version}\nAdvanced Virtual Accelerator Software\n\n${lines.join("\n")}${lines.length ? "\n\n" : ""}C. Jin, Z.-J. Wang, X. Qi, Y. He, K. Li, et al., Phys. Rev. Accel. Beams 28, 044602 (2025)`,
    { title: t("About AVAS") },
  );
}

let closing = false;
async function confirmClose() {
  if (closing) return;
  closing = true;
  try {
    if (useApp.getState().run.running) {
      const ok = await confirmDialog(t("A simulation is running. Stop it and quit?"), { title: t("Quit"), ok: t("Stop and quit"), danger: true });
      if (!ok) return;
    }
    if (!(await resolveUnsaved(t("quitting")))) return;
    if (useApp.getState().run.running) await call("run.stop");
    await call("app.quit");
  } finally {
    closing = false;
  }
}

export function quit() {
  if (canQuit()) confirmClose();
}

// Closing the window: Python cancels the close while something is unsaved or running
// and asks the page (event "app.closeRequested"); the guard flag is kept in sync here.
// In a browser the tab's own "leave page?" prompt guards unsaved changes instead.
on("app.closeRequested", () => confirmClose());
let lastGuard: boolean | null = null;
function syncCloseGuard() {
  const unsaved = Object.values(useDirty.getState().dirty).some(Boolean);
  if (unsaved !== lastGuard) {
    lastGuard = unsaved;
    if (isDesktop()) call("app.closeGuard", { unsaved }).catch(() => undefined);
  }
}
useDirty.subscribe(syncCloseGuard);
if (!isDesktop()) {
  window.addEventListener("beforeunload", (e) => {
    if (lastGuard) e.preventDefault();
  });
}

export function isTyping(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || !!el.closest(".monaco-editor");
}

export function blockedByDialog(): boolean {
  return anyDialogOpen();
}
