// What differs between the desktop window and a browser tab: file dialogs, opening files and
// folders, links, quitting.  Pages call these instead of the dialog.* / shell.* RPCs directly.
import { apiUrl, call, isDesktop } from "./bridge";
import { fileDialog } from "./components/FileDialog";
import { toast } from "./components/overlays";
import { t } from "./i18n";

export type FileFilters = string[]; // "DST (*.dst)", "All files (*.*)"

export async function pickFolder(opts: { directory?: string; title?: string } = {}): Promise<string | null> {
  if (isDesktop()) return call<string | null>("dialog.openFolder", { directory: opts.directory ?? "" });
  return fileDialog({ mode: "folder", directory: opts.directory, title: opts.title });
}

export async function pickFile(opts: { directory?: string; filters?: FileFilters; title?: string } = {}): Promise<string | null> {
  if (isDesktop()) return call<string | null>("dialog.openFile", { directory: opts.directory ?? "", filters: opts.filters ?? [] });
  return fileDialog({ mode: "file", directory: opts.directory, filters: opts.filters, title: opts.title });
}

export async function pickFiles(opts: { directory?: string; filters?: FileFilters; title?: string } = {}): Promise<string[] | null> {
  if (isDesktop()) return call<string[] | null>("dialog.openFile", { directory: opts.directory ?? "", filters: opts.filters ?? [], multiple: true });
  return fileDialog({ mode: "files", directory: opts.directory, filters: opts.filters, title: opts.title });
}

export async function pickSaveFile(opts: { directory?: string; filename?: string; filters?: FileFilters; title?: string } = {}): Promise<string | null> {
  if (isDesktop()) {
    return call<string | null>("dialog.saveFile", { directory: opts.directory ?? "", filename: opts.filename ?? "", filters: opts.filters ?? [] });
  }
  return fileDialog({ mode: "save", directory: opts.directory, filename: opts.filename, filters: opts.filters, title: opts.title });
}

/** Open a file with its default program, or a folder in the file manager.  Browser: download / browse. */
export async function openPath(path: string | null | undefined): Promise<void> {
  if (!path) return;
  if (isDesktop()) return void (await call("shell.open", { path }));
  const st = await call<{ exists: boolean; isDir: boolean }>("fs.stat", { path });
  if (!st.exists) {
    toast(t("Not found: {path}", { path }), "warning");
    return;
  }
  if (st.isDir) {
    await fileDialog({ mode: "browse", directory: path });
    return;
  }
  downloadFile(path);
}

/** Show a file in its folder.  Browser: the page's own folder view with the file selected. */
export async function revealPath(path: string | null | undefined): Promise<void> {
  if (!path) return;
  if (isDesktop()) return void (await call("shell.reveal", { path }));
  const st = await call<{ exists: boolean; isDir: boolean }>("fs.stat", { path });
  if (!st.exists) {
    toast(t("Not found: {path}", { path }), "warning");
    return;
  }
  const dir = st.isDir ? path : path.replace(/[\\/][^\\/]*$/, "");
  await fileDialog({ mode: "browse", directory: dir, select: st.isDir ? undefined : path });
}

/** Save a copy of a back-end file through the browser. */
export function downloadFile(path: string) {
  const a = document.createElement("a");
  a.href = apiUrl("/download", { path });
  a.download = path.split(/[\\/]/).pop() ?? "file";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function openUrl(url: string) {
  if (isDesktop()) call("shell.openUrl", { url }).catch(() => undefined);
  else window.open(url, "_blank", "noopener");
}

/** Only the desktop window can quit the application; a browser tab is just closed. */
export function canQuit(): boolean {
  return isDesktop();
}

/** Page zoom: the WebView2 zoom factor in the window, CSS zoom in a browser. */
export function applyZoom(factor: number) {
  if (isDesktop()) call("app.zoom", { factor }).catch(() => undefined);
  else (document.documentElement.style as CSSStyleDeclaration & { zoom: string }).zoom = factor === 1 ? "" : String(factor);
}
