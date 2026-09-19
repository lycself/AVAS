// The page's own folder / file chooser, used in a browser where there are no native dialogs.
// Lists the back end's file system through fs.list (avas/gui/services/fs.py).
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { apiUrl, call } from "../bridge";
import { humanSize } from "../format";
import { t } from "../i18n";
import { DialogFrame, reportError, showDialog } from "./overlays";
import { Button, Checkbox, cx, Icon, IconButton, Select, TextInput } from "./ui";

export type FileDialogMode = "folder" | "file" | "files" | "save" | "browse";

export type FileDialogOptions = {
  mode: FileDialogMode;
  directory?: string;
  filters?: string[]; // "DST (*.dst)", "All files (*.*)"
  filename?: string; // save: initial name
  title?: string;
  select?: string; // browse: path to highlight
};

type Entry = { name: string; path: string; isDir: boolean; size: number; mtime: number };
type Listing = { dir: string; parent: string | null; roots: string[]; entries: Entry[]; sep: string };

const LAST_DIR_KEY = "avas.fileDialog.dir";

function rememberDir(dir: string) {
  try {
    localStorage.setItem(LAST_DIR_KEY, dir);
  } catch {
    /* storage unavailable */
  }
}

function lastDir(): string {
  try {
    return localStorage.getItem(LAST_DIR_KEY) ?? "";
  } catch {
    return "";
  }
}

/** "PNG image (*.png;*.jpg)" -> ["png", "jpg"]; null means every file. */
function filterExts(filter: string | undefined): string[] | null {
  if (!filter) return null;
  const m = /\(([^)]*)\)/.exec(filter);
  const pats = (m ? m[1] : filter).split(/[;\s]+/).filter(Boolean);
  if (!pats.length || pats.some((p) => p === "*" || p === "*.*")) return null;
  return pats.map((p) => p.replace(/^\*\.?/, "").toLowerCase()).filter(Boolean);
}

function matches(name: string, exts: string[] | null): boolean {
  if (!exts) return true;
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  return exts.includes(ext);
}

function join(dir: string, name: string, sep: string): string {
  return dir.endsWith(sep) || dir.endsWith("/") ? dir + name : dir + sep + name;
}

function titleFor(mode: FileDialogMode): string {
  switch (mode) {
    case "folder":
      return t("Choose a folder");
    case "file":
      return t("Choose a file");
    case "files":
      return t("Choose files");
    case "save":
      return t("Save as");
    default:
      return t("Folder");
  }
}

function Body({ opts, close }: { opts: FileDialogOptions; close: (v: string | string[] | null) => void }) {
  const { mode } = opts;
  const pickFiles = mode === "file" || mode === "files" || mode === "save" || mode === "browse";
  const [listing, setListing] = useState<Listing | null>(null);
  const [pathInput, setPathInput] = useState(opts.directory ?? "");
  const [selected, setSelected] = useState<string[]>(opts.select ? [opts.select] : []);
  const [filename, setFilename] = useState(opts.filename ?? "");
  const [filterIdx, setFilterIdx] = useState(0);
  const [showHidden, setShowHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const filters = opts.filters ?? [];
  const exts = filterExts(filters[filterIdx]);

  const load = async (path: string) => {
    try {
      const res = await call<Listing>("fs.list", { path, showHidden });
      setListing(res);
      setPathInput(res.dir);
      setError(null);
      setSelected((sel) => sel.filter((p) => p.startsWith(res.dir)));
    } catch (e) {
      setError(String((e as Error)?.message ?? e));
    }
  };

  useEffect(() => {
    load(opts.directory || lastDir() || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHidden]);

  useEffect(() => {
    if (!opts.select || !listing) return;
    listRef.current?.querySelector(".fd-row.selected")?.scrollIntoView({ block: "center" });
  }, [listing, opts.select]);

  const entries = (listing?.entries ?? []).filter((e) => e.isDir || (pickFiles && matches(e.name, exts)));

  const accept = () => {
    if (!listing) return;
    rememberDir(listing.dir);
    if (mode === "folder") close(selected.length && entries.find((e) => e.path === selected[0])?.isDir ? selected[0] : listing.dir);
    else if (mode === "file") close(selected[0] ?? null);
    else if (mode === "files") close(selected.length ? selected : null);
    else if (mode === "save") {
      let name = filename.trim();
      if (!name) return;
      if (exts && exts.length === 1 && !name.toLowerCase().endsWith(`.${exts[0]}`)) name += `.${exts[0]}`;
      close(join(listing.dir, name, listing.sep));
    }
  };

  const onRowClick = (e: Entry, ev: MouseEvent) => {
    if (mode === "files" && (ev.ctrlKey || ev.metaKey)) {
      setSelected((sel) => (sel.includes(e.path) ? sel.filter((p) => p !== e.path) : [...sel, e.path]));
      return;
    }
    if (mode === "files" && ev.shiftKey && selected.length) {
      const files = entries.filter((x) => !x.isDir).map((x) => x.path);
      const a = files.indexOf(selected[selected.length - 1]);
      const b = files.indexOf(e.path);
      if (a >= 0 && b >= 0) {
        setSelected(files.slice(Math.min(a, b), Math.max(a, b) + 1));
        return;
      }
    }
    setSelected([e.path]);
    if (mode === "save" && !e.isDir) setFilename(e.name);
  };

  const onRowDoubleClick = (e: Entry) => {
    if (e.isDir) {
      load(e.path);
      return;
    }
    if (mode === "browse") download(e.path);
    else if (mode === "file" || mode === "files") {
      rememberDir(listing!.dir);
      close(mode === "files" ? [e.path] : e.path);
    } else if (mode === "save") accept();
  };

  const download = (path: string) => {
    const a = document.createElement("a");
    a.href = apiUrl("/download", { path });
    a.download = path.split(/[\\/]/).pop() ?? "file";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const goPathInput = async () => {
    const p = pathInput.trim();
    if (!p) return;
    try {
      const st = await call<{ exists: boolean; isDir: boolean }>("fs.stat", { path: p });
      if (st.isDir) load(p);
      else if (st.exists && (mode === "file" || mode === "files")) close(mode === "files" ? [p] : p);
      else setError(t("Not a folder: {path}", { path: p }));
    } catch (e) {
      reportError(e);
    }
  };

  const okDisabled =
    !listing ||
    (mode === "file" && !selected.length) ||
    (mode === "files" && !selected.length) ||
    (mode === "save" && !filename.trim());
  const isWindows = (listing?.sep ?? "/") === "\\";

  return (
    <DialogFrame
      title={opts.title ?? titleFor(mode)}
      icon={mode === "save" ? "save" : "folder-opened"}
      onClose={() => close(null)}
      className="fd-dialog"
      footer={
        <>
          {mode === "browse" ? (
            <span className="fd-hint grow">{t("Double-click a file to download it.")}</span>
          ) : (
            <span className="grow" />
          )}
          {filters.length > 0 && mode !== "browse" && (
            <Select value={filterIdx} options={filters.map((f, i) => ({ value: i, label: f }))} onChange={(v) => setFilterIdx(Number(v))} />
          )}
          <Button onClick={() => close(null)}>{mode === "browse" ? t("Close") : t("Cancel")}</Button>
          {mode !== "browse" && (
            <Button variant="primary" disabled={okDisabled} onClick={accept}>
              {mode === "save" ? t("Save") : mode === "folder" ? t("Choose folder") : t("Open")}
            </Button>
          )}
        </>
      }
    >
      <div className="fd">
        <div className="fd-bar">
          <IconButton icon="arrow-up" tip={t("Parent folder")} disabled={!listing?.parent} onClick={() => listing?.parent && load(listing.parent)} />
          <IconButton icon="home" tip={t("Home folder")} onClick={() => load("")} />
          {isWindows && listing && listing.roots.length > 0 && (
            <Select
              value={listing.roots.find((r) => listing.dir.toLowerCase().startsWith(r.toLowerCase())) ?? ""}
              options={[...(listing.roots.some((r) => listing.dir.toLowerCase().startsWith(r.toLowerCase())) ? [] : [{ value: "", label: "—" }]), ...listing.roots.map((r) => ({ value: r, label: r }))]}
              onChange={(v) => v && load(String(v))}
              tip={t("Drive")}
            />
          )}
          <TextInput
            value={pathInput}
            className="grow"
            style={{ flex: 1 }}
            onChange={(e) => setPathInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                goPathInput();
              }
            }}
          />
          <IconButton icon="refresh" tip={t("Refresh")} onClick={() => listing && load(listing.dir)} />
        </div>
        <div className="fd-list" ref={listRef}>
          {error ? (
            <div className="fd-empty danger-text">{error}</div>
          ) : !listing ? (
            <div className="fd-empty">{t("Loading...")}</div>
          ) : entries.length === 0 ? (
            <div className="fd-empty">{t("Empty folder")}</div>
          ) : (
            entries.map((e) => (
              <div
                key={e.path}
                className={cx("fd-row", selected.includes(e.path) && "selected")}
                onClick={(ev) => onRowClick(e, ev)}
                onDoubleClick={() => onRowDoubleClick(e)}
                title={e.path}
              >
                <Icon name={e.isDir ? "folder" : "file"} />
                <span className="fd-name">{e.name}</span>
                {!e.isDir && <span className="fd-size">{humanSize(e.size)}</span>}
                {mode === "browse" && !e.isDir && <IconButton icon="cloud-download" tip={t("Download")} onClick={(ev) => { ev.stopPropagation(); download(e.path); }} />}
              </div>
            ))
          )}
        </div>
        <div className="fd-foot">
          {mode === "save" && (
            <>
              <span>{t("File name")}</span>
              <TextInput
                value={filename}
                style={{ flex: 1 }}
                onChange={(e) => setFilename(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filename.trim()) {
                    e.preventDefault();
                    accept();
                  }
                }}
              />
            </>
          )}
          {mode === "files" && <span className="fd-hint grow">{t("{n} selected (Ctrl / Shift-click to select more)", { n: selected.length })}</span>}
          {mode !== "save" && mode !== "files" && <span className="grow" />}
          <Checkbox checked={showHidden} onChange={setShowHidden} label={t("Show hidden")} />
        </div>
      </div>
    </DialogFrame>
  );
}

/** Resolves with the chosen path(s), or null when cancelled (always null in "browse" mode). */
export function fileDialog(opts: FileDialogOptions & { mode: "folder" | "file" | "save" | "browse" }): Promise<string | null>;
export function fileDialog(opts: FileDialogOptions & { mode: "files" }): Promise<string[] | null>;
export function fileDialog(opts: FileDialogOptions): Promise<string | string[] | null> {
  return showDialog<string | string[] | null>((close) => <Body opts={opts} close={close} />, { dismissValue: null, width: 680 });
}
