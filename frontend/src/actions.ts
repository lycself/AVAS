// Commands shared by the menu bar, tool bar, shortcuts and pages.
import { call } from "./bridge";
import { alertDialog, anyDialogOpen, choiceDialog, confirmDialog, reportError, toast } from "./components/overlays";
import { t } from "./i18n";
import { refreshProject, setPage, setProject, showStatus, useApp, type ProjectSummary } from "./store/app";
import { allPages, dirtyPages } from "./store/pages";

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
      target = (await call<string | null>("dialog.openFolder", { directory: start })) ?? undefined;
      if (!target) return;
    }
    if (!(await resolveUnsaved(t("opening another project")))) return;
    const summary = await call<ProjectSummary>("project.open", { path: target });
    setProject(summary);
    if (useApp.getState().page === "project") setPage("beam");
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
    const target = await call<string | null>("dialog.saveFile", { directory: start, filename: "avas_project" });
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

export async function runSimulation() {
  const app = useApp.getState();
  if (!app.project.open || app.run.running) return;
  const errors = allPages().flatMap((p) => p.validate?.() ?? []);
  if (errors.length) {
    await alertDialog(errors.join("\n"), { title: t("Cannot run"), kind: "warning" });
    return;
  }
  if (!(await saveAll(true))) return;
  try {
    await call("run.check");
  } catch (e) {
    await reportError(e, t("Project check"));
    return;
  }
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

export function showAbout() {
  alertDialog(
    `AVAS ${useApp.getState().version}\nAdvanced Virtual Accelerator Software\n\nC. Jin, Z.-J. Wang, X. Qi, Y. He, K. Li, et al., Phys. Rev. Accel. Beams 28, 044602 (2025)`,
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
  confirmClose();
}

/** Called synchronously by Python when the window's close button is pressed. */
window.__avasCanClose = () => {
  if (!useApp.getState().run.running && !dirtyPages().length) return true;
  window.setTimeout(confirmClose, 0);
  return false;
};

export function isTyping(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || !!el.closest(".monaco-editor");
}

export function blockedByDialog(): boolean {
  return anyDialogOpen();
}
