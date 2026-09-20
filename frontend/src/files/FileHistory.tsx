import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { call } from "../bridge";
import { DialogFrame, showDialog, reportError, toast } from "../components/overlays";
import { Button, Icon, IconButton, Spinner } from "../components/ui";
import { useT } from "../i18n";
import { defineThemes, monaco } from "../lattice/monaco";
import { inputsLocked, useApp, useInputsLocked } from "../store/app";
import { onFileSaved } from "../store/pages";
import { restoreHistoryVersion } from "./historyRestore";

type Revision = { id: string; time: number; source: string; sha256: string; restored_from?: string };
type Props = { path: string; getText: () => string; onRestore: (text: string, revision: string) => void; available?: () => boolean; onRestored?: () => void; onBack?: () => void };
type Comparison = { path: string; project: string | undefined; before: string; after: string };
const sources: Record<string, string> = {
  file: "Files page", lattice: "Text + structure", visual: "Visual editor", beam: "Beam page",
  settings: "Settings page", assistant: "AI assistant", restore: "Restored version",
  "before-save": "Before saving / external change", "before-restore": "Before restoring (editor snapshot)",
};

function Diff({ before, after }: { before: string; after: string }) {
  const host = useRef<HTMLDivElement>(null);
  const theme = useApp((s) => s.resolvedTheme);
  useEffect(() => { defineThemes(); }, [theme]);
  useEffect(() => {
    const original = monaco.editor.createModel(before, "plaintext");
    const modified = monaco.editor.createModel(after, "plaintext");
    const editor = monaco.editor.createDiffEditor(host.current!, {
      readOnly: true, originalEditable: false, automaticLayout: true,
      minimap: { enabled: false }, renderSideBySide: true, renderSideBySideInlineBreakpoint: 0, scrollBeyondLastLine: false,
    });
    editor.setModel({ original, modified });
    return () => { editor.dispose(); original.dispose(); modified.dispose(); };
  }, [before, after]);
  return <div ref={host} className="history-diff-editor" />;
}


function HistoryPanel({ path, getText, onRestore, onCompare, toolbarHost, available, onRestored, onBack }: Props & {
  onCompare: (comparison: Comparison | null) => void; toolbarHost: HTMLDivElement | null;
}) {
  const t = useT();
  const locked = useInputsLocked();
  const project = useApp((s) => s.project.path);
  const [entries, setEntries] = useState<Revision[] | null>(null);
  const [selected, setSelected] = useState("");
  const [version, setVersion] = useState<{ id: string; text: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const current = useRef({ getText, onRestore, onCompare, available, onRestored });
  current.current = { getText, onRestore, onCompare, available, onRestored };
  const alive = useRef(true);
  const comparedText = useRef("");
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => onFileSaved((saved) => {
    if (saved.toLowerCase() === path.toLowerCase()) setRefresh((n) => n + 1);
  }), [path]);
  useEffect(() => {
    let cancelled = false;
    call<Revision[]>("history.list", { path }).then((list) => {
      if (!cancelled) { setEntries(list); setError(""); }
    }).catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [path, refresh]);
  useEffect(() => {
    setVersion(null);
    current.current.onCompare(null);
    if (!selected) return;
    let cancelled = false;
    call<{ id: string; text: string }>("history.version", { path, revision: selected }).then((v) => {
      if (cancelled) return;
      comparedText.current = current.current.getText();
      setVersion(v); setError("");
      current.current.onCompare({ path, project, before: v.text, after: comparedText.current });
    }).catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [path, project, selected, refresh]);
  const sourceLabel = (v: Revision) => {
    const index = entries?.findIndex((entry) => entry.id === v.restored_from) ?? -1;
    if (index >= 0 && entries) return t(v.source === "restore-edited" ? "Modified after restoring version {n}" : "Restored from version {n}", { n: entries.length - index });
    return t(sources[v.source] ?? "Saved version");
  };
  const restore = async () => {
    if (!version || version.id !== selected || busy || locked || available?.() === false) return;
    if (current.current.getText() !== comparedText.current) {
      setError(t("The editor changed. Refresh the comparison before restoring."));
      return;
    }
    setBusy(true);
    try {
      const result = await restoreHistoryVersion({ getText: () => current.current.getText(),
        available: () => alive.current && current.current.available?.() !== false && useApp.getState().project.path === project && !inputsLocked(useApp.getState().run),
        prepare: (currentText) => call<{ text: string }>("history.prepareRestore", { path, revision: version.id, currentText }),
        apply: (text) => current.current.onRestore(text, version.id),
      });
      if (result === "changed") throw new Error(t("The editor changed. Refresh the comparison before restoring."));
      if (result !== "restored") return;
      toast(t("Version restored to the editor. Save to update the file."), "success");
      setSelected(""); setRefresh((n) => n + 1); current.current.onCompare(null);
      current.current.onRestored?.();
    } catch (e) { reportError(e); }
    finally { if (alive.current) setBusy(false); }
  };
  return <>
    <div className="history-file-row">
      <span className="ellipsis" title={path}>{path.split(/[\\/]/).pop()}</span>
      <IconButton icon="refresh" tip={t("Refresh comparison")} onClick={() => setRefresh((n) => n + 1)} />
    </div>
    <div className="history-versions">
      {error && <p className="danger-text">{error}</p>}
      {!entries && !error && <Spinner />}
      {entries?.length === 0 && <p>{t("No saved versions yet. History begins with the next save.")}</p>}
      {entries?.map((v, index) => <button key={v.id} className={`history-version${selected === v.id ? " active" : ""}`} aria-pressed={selected === v.id}
        title={`${t("Version {n}", { n: entries.length - index })} · ${new Date(v.time * 1000).toLocaleString()}`}
        onClick={() => { setSelected(v.id); setRefresh((n) => n + 1); }}>
        <time dateTime={new Date(v.time * 1000).toISOString()}>{new Date(v.time * 1000).toLocaleString(undefined, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}</time>
        <span className="muted">{sourceLabel(v)}</span>
      </button>)}
    </div>
    {toolbarHost && !!selected && createPortal(<>
      <div className="history-comparison-actions">
        <span className="muted grow">{t("Comparison: selected version (left) → current editor (right)")}</span>
        <Button small icon="history" disabled={!version || version.id !== selected || busy || locked || available?.() === false} onClick={restore}
          tip={t("Version restored to the editor. Save to update the file.")}>{t("Restore this version")}</Button>
        <Button small variant="ghost" icon="arrow-left" onClick={() => { setSelected(""); onCompare(null); onBack?.(); }}>{t("Back to editor")}</Button>
      </div>
      {locked && <p className="warning-text">{t("The input files are locked while a simulation runs")}</p>}
    </>, toolbarHost)}
  </>;
}

/** The Files page supplies a list host below its file tree; editor contents stay mounted. */
export function FileHistoryWorkspace({ children, listHost, actionHost, ...props }: Props & {
  children: ReactNode; listHost: HTMLDivElement | null; actionHost?: HTMLDivElement | null;
}) {
  const project = useApp((s) => s.project.path);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [toolbarHost, setToolbarHost] = useState<HTMLDivElement | null>(null);
  const compare = comparison?.path === props.path && comparison.project === project ? comparison : null;
  return <div className="history-workspace">
    {listHost && props.path && createPortal(
      <HistoryPanel key={`${project}:${props.path}`} {...props} onCompare={setComparison} toolbarHost={actionHost === undefined ? toolbarHost : actionHost} />, listHost,
    )}
    <div className="history-editor" style={{ display: compare ? "none" : undefined }}>{children}</div>
    {compare && <div className="history-comparison">
      {actionHost === undefined ? <div ref={setToolbarHost} className="history-comparison-header" /> : null}
      <Diff before={compare.before} after={compare.after} />
    </div>}
  </div>;
}

export function FileHistoryDock({ setHost, available }: { setHost: (host: HTMLDivElement | null) => void; available: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(true);
  const [height, setHeight] = useState(220);
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; height: number } | null>(null);
  return <div ref={root} className={`files-history-dock${open ? "" : " collapsed"}`} style={open ? { height } : undefined}>
    {open && <div className="files-history-sash" role="separator" aria-label={t("Resize file history")} aria-orientation="horizontal" tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); setHeight(Math.max(100, Math.min(Math.max(100, (root.current!.parentElement?.clientHeight ?? 500) - 120), root.current!.getBoundingClientRect().height + (e.key === "ArrowUp" ? 20 : -20)))); }
      }} onPointerDown={(e) => {
        e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { y: e.clientY, height: root.current!.getBoundingClientRect().height };
      }} onPointerMove={(e) => {
        if (!drag.current || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
        const maximum = Math.max(100, (root.current!.parentElement?.clientHeight ?? 500) - 120);
        setHeight(Math.max(100, Math.min(maximum, drag.current.height + drag.current.y - e.clientY)));
      }} onPointerUp={(e) => { drag.current = null; e.currentTarget.releasePointerCapture(e.pointerId); }} />}
    <button className="files-history-heading" aria-expanded={open} onClick={() => setOpen(!open)}>
      <Icon name={open ? "chevron-down" : "chevron-right"} /><span>{t("File history")}</span>
    </button>
    <div className="files-history-list" ref={setHost} style={{ display: open ? undefined : "none" }}>
      {!available && <p className="muted history-empty">{t("Select a file with history support to view its saved versions.")}</p>}
    </div>
  </div>;
}

function HistoryDialog({ close, ...props }: Props & { close: () => void }) {
  const t = useT();
  const [listHost, setListHost] = useState<HTMLDivElement | null>(null);
  const [actionHost, setActionHost] = useState<HTMLDivElement | null>(null);
  return <DialogFrame title={t("File history")} icon="history" onClose={close} footer={<>
    <div className="history-dialog-actions" ref={setActionHost} />
    <Button onClick={close}>{t("Close")}</Button>
  </>}>
    <div className="history-dialog-layout">
      <div className="history-dialog-list" ref={setListHost} />
      <FileHistoryWorkspace {...props} listHost={listHost} actionHost={actionHost} onRestored={close} onBack={close}>
        <div className="empty-state muted">{t("Select a saved version to compare with the current editor.")}</div>
      </FileHistoryWorkspace>
    </div>
  </DialogFrame>;
}

export function FileHistoryButton(props: Props) {
  const t = useT();
  const project = useApp((s) => s.project.path);
  const current = useRef({ ...props, project });
  current.current = { ...props, project };
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  return <Button small icon="history" tip={t("File history")} onClick={() => {
    const path = props.path;
    void showDialog<void>((close) => <HistoryDialog {...props} close={close}
      getText={() => current.current.getText()} onRestore={(text, revision) => current.current.onRestore(text, revision)}
      available={() => mounted.current && current.current.path === path && current.current.project === project} />,
    { width: "min(1160px, 94vw)" });
  }}>{t("History")}</Button>;
}
