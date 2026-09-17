import { useCallback, useEffect, useRef, useState } from "react";
import { call } from "../bridge";
import { choiceDialog, reportError, toast } from "../components/overlays";
import { Button, Segmented, Select, Spinner } from "../components/ui";
import { t, useT } from "../i18n";
import { LatticeEditor, type LatticeEditorHandle } from "../lattice/LatticeEditor";
import { refreshProject, useApp, useInputsLocked } from "../store/app";
import { registerLatticeEditor } from "../assistant/front";
import { setLatticeMode, setVisualEditing, useLatticeUi } from "../store/latticeUi";
import { fileSaved, markDirty, onFileSaved, registerPage } from "../store/pages";
import { NoProject, PageHeader, RunLockBanner } from "./common";

type ListInfo = { active: string; activePath: string; files: { name: string; missing: boolean }[]; fieldDirs: string[]; envOverride: string | null };

export default function LatticePage() {
  const tt = useT();
  const projectPath = useApp((s) => (s.project.open ? s.project.path : null));
  const projectLattice = useApp((s) => s.project.latticeName);
  const [info, setInfo] = useState<ListInfo | null>(null);
  const [loaded, setLoaded] = useState<{ name: string; path: string; text: string; key: number } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<LatticeEditorHandle>(null);
  const mode = useLatticeUi((s) => s.mode);
  const locked = useInputsLocked();
  const savedText = useRef("");
  const current = useRef<{ name: string; path: string } | null>(null);

  /** Open a lattice file in the editor (the run lattice when no name is given). Opening never changes the run lattice. */
  const load = useCallback(async (name?: string) => {
    try {
      const list = await call<ListInfo>("lattice.list");
      setInfo(list);
      const file = await call<{ name: string; path: string; text: string }>("lattice.read", { name: name ?? list.active });
      savedText.current = normalize(file.text);
      current.current = { name: file.name, path: file.path };
      setVisualEditing(false); // a (re)loaded lattice opens in the browse state
      setLoaded({ ...file, key: Date.now() });
      setDirty(false);
      markDirty("lattice", false);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }, []);

  useEffect(() => {
    if (projectPath) load();
    else {
      setInfo(null);
      setLoaded(null);
      current.current = null;
      markDirty("lattice", false);
    }
  }, [projectPath, load]);

  const save = useCallback(async () => {
    const cur = current.current;
    if (!cur || !editorRef.current) return;
    const text = editorRef.current.getText();
    await call("lattice.write", { name: cur.name, text });
    savedText.current = normalize(text);
    setDirty(false);
    markDirty("lattice", false);
    fileSaved(cur.path, "lattice");
  }, []);

  useEffect(
    () =>
      registerPage({
        id: "lattice",
        label: () => current.current?.name ?? "lattice",
        isDirty: () => !!editorRef.current && !!current.current && normalize(editorRef.current.getText()) !== savedText.current,
        save,
        validate: () => {
          if (!current.current || !editorRef.current) return [];
          return editorRef.current.getText().trim() ? [] : [t("Lattice: {name} is empty", { name: current.current.name })];
        },
        reload: () => load(current.current?.name),
      }),
    [save, load],
  );

  // the assistant reads and changes the lattice through the open editor
  useEffect(
    () =>
      registerLatticeEditor({
        name: () => current.current?.name ?? null,
        path: () => current.current?.path ?? null,
        getText: () => (editorRef.current && current.current ? editorRef.current.getText() : null),
        isDirty: () => !!editorRef.current && !!current.current && normalize(editorRef.current.getText()) !== savedText.current,
        replaceText: (text) => editorRef.current?.replaceText(text),
        save,
        selection: () => editorRef.current?.selection() ?? null,
      }),
    [save],
  );

  // the same file saved on the Files page, or the run lattice switched there
  useEffect(
    () =>
      onFileSaved((path, source) => {
        if (source === "lattice") return;
        const cur = current.current;
        const isDirty = !!editorRef.current && !!cur && normalize(editorRef.current.getText()) !== savedText.current;
        if (cur && path.toLowerCase() === cur.path.toLowerCase()) {
          if (isDirty) toast(tt("{name} was changed on the Files page; this page still has unsaved edits.", { name: cur.name }), "warning", 6000);
          else load(cur.name);
        }
      }),
    [load, tt],
  );
  // the run lattice changed (Files page, this page or the assistant): follow it when the editor was
  // showing the previous run lattice and has no unsaved edits, otherwise only refresh the "(run)" mark
  useEffect(() => {
    const cur = current.current;
    if (!projectLattice || !cur) return;
    if (projectLattice !== cur.name && cur.name === info?.active && !dirtyRef()) load();
    else call<ListInfo>("lattice.list").then(setInfo).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectLattice]);

  function dirtyRef() {
    return !!editorRef.current && !!current.current && normalize(editorRef.current.getText()) !== savedText.current;
  }

  if (!projectPath) return <NoProject />;
  if (error) return <div className="empty-state danger-text">{error}</div>;
  if (!info || !loaded) return <div className="empty-state"><Spinner size={24} /></div>;

  /** Unsaved edits: save, drop or cancel; false when the caller should stop. */
  const settleDirty = async () => {
    if (!dirtyRef()) return true;
    const choice = await choiceDialog(
      tt("Save changes to {name}?", { name: current.current!.name }),
      [
        { key: "save", label: tt("Save"), variant: "primary" },
        { key: "discard", label: tt("Don't save") },
        { key: "cancel", label: tt("Cancel") },
      ],
      { title: tt("Unsaved changes") },
    );
    if (!choice || choice === "cancel") return false;
    if (choice === "save") await save();
    return true;
  };

  // Opening a file only changes what the editor shows; it is allowed during a run (read-only then).
  const openFile = async (name: string) => {
    if (name === current.current?.name) return;
    try {
      if (!(await settleDirty())) return;
      await load(name);
    } catch (e) {
      reportError(e);
    }
  };

  // Making the opened file the run lattice writes ini.ini, which the run lock protects.
  const useForRun = async () => {
    const cur = current.current;
    if (!cur) return;
    try {
      if (!(await settleDirty())) return;
      setInfo(await call<ListInfo>("lattice.setSource", { name: cur.name }));
      await refreshProject();
    } catch (e) {
      reportError(e);
    }
  };

  const isRunLattice = loaded.name === info.active;

  return (
    <div className="page-fill">
      <PageHeader
        title={tt("Lattice")}
        hint={tt("The lattice files of the project. Any of them can be opened here; the one marked (run) is used by the simulation. Edit the opened file as text on the left or by physical parameters on the right; both show the same file. Parameter meanings and checks follow the user manual.")}
      />
      <div className="row" style={{ gap: 8 }}>
        <Segmented
          value={mode}
          onChange={setLatticeMode}
          options={[
            { value: "text", label: tt("Text + structure"), icon: "code", tip: tt("Text editor and structure editor side by side") },
            { value: "visual", label: tt("Visual editor"), icon: "circuit-board", tip: tt("Components, beam envelope and live linear preview") },
          ]}
        />
        <div className="divider-v" />
        <span className="muted nowrap">{tt("Lattice file")}</span>
        <Select
          value={loaded.name}
          style={{ minWidth: 260 }}
          tip={tt("Every AVAS-format lattice found in InputFile/. Opening a file only shows it here (read-only while a simulation runs); 'Use for the run' makes it the lattice the simulation reads.")}
          options={info.files.map((f) => ({
            value: f.name,
            label: f.name + (f.name === info.active ? tt("  (run)") : "") + (f.name === loaded.name && dirty ? " •" : "") + (f.missing ? tt("  (missing)") : ""),
          }))}
          onChange={openFile}
        />
        <span className="soft ellipsis grow" data-tip={loaded.path}>
          {loaded.path}
        </span>
        {info.envOverride && <span className="warning-text">{tt("AVAS_LATTICE is set: {name}", { name: info.envOverride })}</span>}
        {!isRunLattice && (
          <Button
            icon="play-circle"
            disabled={locked}
            tip={
              locked
                ? tt("The run uses {name}; it cannot be changed while a simulation runs", { name: info.active })
                : tt("The run uses {name}. Make the opened file the lattice the simulation reads instead (stored in ini.ini, also used by 'avas run')", { name: info.active })
            }
            onClick={useForRun}
          >
            {tt("Use for the run")}
          </Button>
        )}
        {mode === "text" && dirty && (
          <Button
            variant="ghost"
            icon="discard"
            disabled={locked}
            onClick={() => {
              editorRef.current?.setText(loaded.text);
              setDirty(false);
              markDirty("lattice", false);
            }}
          >
            {tt("Revert")}
          </Button>
        )}
        {mode === "text" && (
          <Button variant="primary" icon="save" disabled={!dirty || locked} tip={tt("Save the lattice file (Ctrl+S saves all pages)")} onClick={() => save().catch(reportError)}>
            {tt("Save")}
          </Button>
        )}
      </div>
      <RunLockBanner />
      <div className="editor-host">
        <LatticeEditor
          key={loaded.key}
          ref={editorRef}
          readOnly={locked}
          initialText={loaded.text}
          fieldDirs={info.fieldDirs}
          layout={mode === "visual" ? "visual" : "split"}
          dirty={dirty}
          onSave={save}
          runResults={isRunLattice}
          onChange={(text) => {
            const d = normalize(text) !== savedText.current;
            setDirty(d);
            markDirty("lattice", d);
          }}
        />
      </div>
    </div>
  );
}

function normalize(text: string) {
  return text.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
}
