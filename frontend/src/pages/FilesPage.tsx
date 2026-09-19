import { useCallback, useEffect, useRef, useState } from "react";
import { call } from "../bridge";
import { openPath, pickFiles, revealPath } from "../host";
import { choiceDialog, confirmDialog, openMenu, promptDialog, reportError, toast } from "../components/overlays";
import { Badge, Button, cx, Icon, IconButton, Spinner, Tabs } from "../components/ui";
import { humanSize } from "../format";
import { pick, t, useT } from "../i18n";
import { LatticeEditor, type LatticeEditorHandle } from "../lattice/LatticeEditor";
import { loadSchema, type Schema } from "../lattice/types";
import { refreshProject, setPage, useApp, useInputsLocked } from "../store/app";
import { fileSaved, getPage, markDirty, onFileSaved, registerPage } from "../store/pages";
import { BOUNDARY_COLUMNS, IniTable, KeywordTable, scanDataColumns, TokenTable, TraceWinTable } from "../files/tables";
import { FieldMapView, ParticlesView, PlainEditor, type PlainEditorHandle } from "../files/views";
import { NoProject, PageHeader, RunLockBanner } from "./common";

type FileEntry = { name: string; path: string; kind: string; group: string; role: string; accent: boolean; editable: boolean; size: number; mtime: number };
type Listing = { dir: string; files: FileEntry[]; latticeName: string; latticePath: string; fieldDirs: string[] };
type Opened = FileEntry & { view: "text" | "info"; text?: string; tooLarge?: boolean; modified?: string };

const GROUPS: [string, string][] = [
  ["engine", "Engine inputs"],
  ["lattices", "Other lattices"],
  ["particles", "Particle data"],
  ["fieldmaps", "Field maps"],
  ["other", "Other files"],
];

function roleLabel(role: string) {
  const map: Record<string, string> = {
    lattice_run: "lattice (run)",
    lattice: "lattice",
    generated: "generated",
    tracewin_lattice: "TraceWin lattice",
    beam: "engine input",
    input: "engine input",
    boundary: "engine input",
    scandata: "engine input",
    separticle: "engine input",
    gui_ini: "GUI settings",
    particles: "particles",
    plt: "step data",
    fieldmap: "field map",
    tracewin_project: "TraceWin project",
    text: "reference",
    binary: "other",
  };
  return t(map[role] ?? role);
}

function roleDescription(f: FileEntry, latticeName: string) {
  switch (f.role) {
    case "lattice_run":
      return t("The lattice used for the run; also edited on the Lattice page.");
    case "lattice":
      return t("AVAS lattice not used for the run. 'Use for the run' switches to it.") + (f.name.toLowerCase() === "lattice_env.txt" ? t(" Used by the envelope model.") : "");
    case "generated":
      return t("Rewritten from {name} before every run; read-only.", { name: latticeName });
    case "tracewin_lattice":
      return t("TraceWin format (lengths in mm). AVAS cannot run it directly; read-only.");
    case "beam":
      return t("Initial beam; also edited on the Beam page.");
    case "input":
      return t("Tracking options; also edited on the Settings page.");
    case "boundary":
      return t("Loss boundary, used when boundary is 1 in input.txt; lattice apertures are then ignored.");
    case "scandata":
      return t("Entry phase and time of every RF cavity, read when scanphase is 2.");
    case "separticle":
      return t("Secondary particles, read when secondarybeam is 1.");
    case "gui_ini":
      return t("Run mode, error study, lattice file and field-map directory.");
    case "particles":
      return t("Particle distribution; shown, not edited.");
    case "plt":
      return t("Beam at every dumped step; open it on the Results page.");
    case "fieldmap":
      return t("3D field map referenced by 'field' elements; shown, not edited.");
    case "tracewin_project":
      return t("TraceWin binary options file; AVAS does not read it.");
    case "text":
      return t("Text file not read by the engine.");
    default:
      return t("Binary file.");
  }
}

function tableTitle(kind: string) {
  if (kind === "lattice" || kind === "generated_lattice" || kind === "beam" || kind === "input" || kind === "gui_ini") return t("Parameters");
  if (kind === "tracewin_lattice") return t("Elements");
  return t("Table");
}

export default function FilesPage() {
  const tt = useT();
  const projectPath = useApp((s) => (s.project.open ? s.project.path : null));
  const page = useApp((s) => s.page);
  const locked = useInputsLocked();
  const [listing, setListing] = useState<Listing | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ fieldmaps: true });
  const [opened, setOpened] = useState<Opened | null>(null);
  const [text, setText] = useState("");
  const [tab, setTab] = useState<"table" | "text">("table");
  const [schema, setSchema] = useState<Schema | null>(null);
  const [cavities, setCavities] = useState<string[]>([]);
  const [openKey, setOpenKey] = useState(0);
  const saved = useRef("");
  const textRef = useRef(text);
  textRef.current = text;
  const openedRef = useRef(opened);
  openedRef.current = opened;
  const plainRef = useRef<PlainEditorHandle>(null);
  const latticeRef = useRef<LatticeEditorHandle>(null);

  const isDirty = () => !!openedRef.current && openedRef.current.view === "text" && textRef.current !== saved.current;
  const dirty = !!opened && opened.view === "text" && text !== saved.current;

  useEffect(() => {
    loadSchema().then(setSchema);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setListing(await call<Listing>("files.list"));
    } catch (e) {
      reportError(e);
    }
  }, []);

  const openFile = useCallback(async (path: string, keepTab = false) => {
    try {
      const f = await call<Opened>("files.open", { path });
      saved.current = f.text ?? "";
      setText(f.text ?? "");
      setOpened(f);
      setOpenKey((k) => k + 1);
      markDirty("files", false);
      if (!keepTab) setTab(["text", "binary"].includes(f.kind) ? "text" : "table");
      if (f.kind === "scandata") call<string[]>("files.rfCavities").then(setCavities).catch(() => setCavities([]));
    } catch (e) {
      reportError(e);
    }
  }, []);

  useEffect(() => {
    setOpened(null);
    markDirty("files", false);
    if (projectPath) refresh();
    else setListing(null);
  }, [projectPath, refresh]);

  // re-list when the page is shown or the window regains focus (files may change outside AVAS)
  useEffect(() => {
    if (page !== "files" || !projectPath) return;
    refresh();
    const f = openedRef.current;
    if (f && !isDirty()) openFile(f.path, true);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, projectPath]);

  const save = useCallback(async () => {
    const f = openedRef.current;
    if (!f || !isDirty()) return;
    const content = textRef.current;
    await call("files.save", { path: f.path, text: content });
    saved.current = content;
    setText(content + ""); // re-render
    markDirty("files", false);
    fileSaved(f.path, "files");
    refresh();
    toast(t("Saved {name}", { name: f.name }), "success", 2000);
  }, [refresh]);

  useEffect(
    () =>
      registerPage({
        id: "files",
        label: () => openedRef.current?.name ?? "file",
        isDirty,
        save,
        reload: async () => {
          const f = openedRef.current;
          if (f) await openFile(f.path, true);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [save, openFile],
  );

  // another page saved the file shown here
  useEffect(
    () =>
      onFileSaved((path, source) => {
        if (source === "files") return;
        const f = openedRef.current;
        if (f && f.path.toLowerCase() === path.toLowerCase() && !isDirty()) openFile(f.path, true);
        refresh();
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openFile, refresh],
  );

  const edit = (next: string, from: "table" | "text") => {
    setText(next);
    markDirty("files", next !== saved.current);
    if (from === "table") plainRef.current?.setText(next);
  };

  const confirmLeave = async (): Promise<boolean> => {
    if (!isDirty()) return true;
    const choice = await choiceDialog(
      tt("Save changes to {name}?", { name: openedRef.current!.name }),
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

  const select = async (f: FileEntry) => {
    if (opened?.path === f.path) return;
    if (!(await confirmLeave())) return;
    openFile(f.path);
  };

  const rename = async (f: FileEntry) => {
    if (openedRef.current?.path === f.path && !(await confirmLeave())) return;
    const name = await promptDialog(tt("New name for {name}:", { name: f.name }), f.name, {
      title: tt("Rename"),
      validate: (v) => (!v.trim() ? tt("Enter a name.") : /[\\/:*?"<>|]/.test(v) ? tt("A file name cannot contain \\ / : * ? \" < > |") : null),
    });
    if (!name || name === f.name) return;
    try {
      const target = await call<string>("files.rename", { path: f.path, newName: name });
      await refresh();
      await refreshProject();
      if (openedRef.current?.path === f.path) openFile(target, true);
    } catch (e) {
      reportError(e);
    }
  };

  const trash = async (f: FileEntry) => {
    const ok = await confirmDialog(tt("Move {name} to the recycle bin?", { name: f.name }), { title: tt("Delete"), ok: tt("Move to recycle bin"), danger: true });
    if (!ok) return;
    try {
      await call("files.trash", { path: f.path });
      if (openedRef.current?.path === f.path) {
        setOpened(null);
        markDirty("files", false);
      }
      refresh();
    } catch (e) {
      reportError(e);
    }
  };

  const importFiles = async () => {
    try {
      const paths = await pickFiles({ title: tt("Copy files into InputFile...") });
      if (!paths?.length) return;
      let res = await call<{ copied: string[]; existing: string[] }>("files.import", { sources: paths });
      if (res.existing.length) {
        const ok = await confirmDialog(tt("These files already exist in InputFile and will be overwritten:\n{names}", { names: res.existing.join("\n") }), { title: tt("Overwrite files"), ok: tt("Overwrite"), danger: true });
        if (ok) {
          const again = await call<{ copied: string[] }>("files.import", { sources: paths.filter((p) => res.existing.some((n) => p.endsWith(n))), overwrite: true });
          res = { copied: [...res.copied, ...again.copied], existing: [] };
        }
      }
      if (res.copied.length) toast(tt("Copied {n} files into InputFile", { n: res.copied.length }), "success");
      refresh();
    } catch (e) {
      reportError(e);
    }
  };

  const newFile = async () => {
    const name = await promptDialog(tt("Name of the new file in InputFile:"), "new.txt", { title: tt("New file") });
    if (!name) return;
    try {
      const path = await call<string>("files.create", { name });
      await refresh();
      if (await confirmLeave()) openFile(path);
    } catch (e) {
      reportError(e);
    }
  };

  const useForRun = async (f: FileEntry) => {
    try {
      if (openedRef.current?.path === f.path && isDirty()) await save();
      const latticePage = getPage("lattice");
      if (latticePage?.isDirty()) {
        const choice = await choiceDialog(
          tt("The Lattice page has unsaved changes to {name}. Save them before switching?", { name: latticePage.label() }),
          [
            { key: "save", label: tt("Save"), variant: "primary" },
            { key: "discard", label: tt("Don't save") },
            { key: "cancel", label: tt("Cancel") },
          ],
          { title: tt("Unsaved changes") },
        );
        if (!choice || choice === "cancel") return;
        if (choice === "save") await latticePage.save();
      }
      await call("files.useLattice", { path: f.path });
      await refreshProject();
      await refresh();
      if (openedRef.current) openFile(openedRef.current.path, true);
    } catch (e) {
      reportError(e);
    }
  };

  const useAsBeam = async (name: string) => {
    const beamPage = getPage("beam");
    if (beamPage?.isDirty()) {
      const ok = await confirmDialog(tt("The Beam page has unsaved changes; they will be saved first."), { title: tt("Beam") });
      if (!ok) return;
      await beamPage.save();
    }
    try {
      const res = await call<any>("beam.useParticles", { name });
      fileSaved(res.path, "files");
      toast(tt("Initial beam read from {name}", { name }), "success");
      setPage("beam");
    } catch (e) {
      reportError(e);
    }
  };

  const contextMenu = (e: React.MouseEvent, f: FileEntry) => {
    e.preventDefault();
    openMenu(
      [
        { label: tt("Open"), icon: "go-to-file", onClick: () => select(f) },
        ...(f.role === "lattice" ? [{ label: tt("Use for the run"), icon: "play-circle", disabled: locked, onClick: () => useForRun(f) }] : []),
        ...(f.kind === "particles" ? [{ label: tt("Use as initial beam"), icon: "arrow-right", disabled: locked, onClick: () => useAsBeam(f.name) }] : []),
        { type: "separator" },
        { label: tt("Rename..."), icon: "edit", disabled: locked, onClick: () => rename(f) },
        {
          label: tt("Duplicate"),
          icon: "copy",
          disabled: locked,
          onClick: async () => {
            try {
              await call("files.duplicate", { path: f.path });
              refresh();
            } catch (err) {
              reportError(err);
            }
          },
        },
        { label: tt("Move to recycle bin"), icon: "trash", danger: true, disabled: locked, onClick: () => trash(f) },
        { type: "separator" },
        { label: tt("Reveal in Explorer"), icon: "folder-opened", onClick: () => revealPath(f.path).catch(reportError) },
        { label: tt("Open with the default program"), icon: "link-external", onClick: () => openPath(f.path).catch(reportError) },
        { label: tt("Copy path"), icon: "clippy", onClick: () => navigator.clipboard?.writeText(f.path) },
      ],
      e.clientX,
      e.clientY,
    );
  };

  if (!projectPath) return <NoProject />;
  if (!listing || !schema) return <div className="empty-state"><Spinner size={24} /></div>;

  const groups = GROUPS.map(([id, title]) => ({ id, title, files: listing.files.filter((f) => f.group === id) })).filter((g) => g.files.length);

  const renderContent = () => {
    if (!opened) return <div className="empty-state soft">{tt("Choose a file on the left.")}</div>;
    if (opened.view === "info") {
      if (opened.kind === "particles" || opened.kind === "particles_ext") return <ParticlesView path={opened.path} onUseAsBeam={locked ? undefined : () => useAsBeam(opened.name)} />;
      if (opened.kind === "fieldmap") return <FieldMapView path={opened.path} />;
      const why = opened.tooLarge ? tt("Larger than {size} - open it with an external editor.", { size: "2.0 MB" }) : roleDescription(opened, listing.latticeName);
      return (
        <div className="selectable muted" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
          {why}
          {"\n\n"}
          {tt("Size")}: {humanSize(opened.size)}
          {"\n"}
          {tt("Modified")}: {opened.modified}
          {"\n"}
          {opened.path}
          {"\n\n"}
          <Button icon="link-external" onClick={() => openPath(opened.path).catch(reportError)}>
            {tt("Open with the default program")}
          </Button>
        </div>
      );
    }
    const readOnly = !opened.editable || locked;
    const isLattice = opened.kind === "lattice" || opened.kind === "generated_lattice";
    let table: React.ReactNode = null;
    const tprops = { text, editable: !readOnly, onChange: (v: string) => edit(v, "table" as const), schema };
    if (opened.kind === "beam") table = <KeywordTable {...tprops} file="beam" />;
    else if (opened.kind === "input") table = <KeywordTable {...tprops} file="input" />;
    else if (opened.kind === "gui_ini") table = <IniTable {...tprops} />;
    else if (opened.kind === "boundary")
      table = <TokenTable {...tprops} columns={BOUNDARY_COLUMNS} wrapStartEnd hint={tt("Used when 'Apply boundary' is enabled in Settings; lattice apertures are then ignored.")} />;
    else if (opened.kind === "scandata")
      table = <TokenTable {...tprops} columns={scanDataColumns()} rowLabels={cavities} hint={tt("Read when phase scan mode is 2 (Settings); rows follow the RF cavities in lattice order.")} />;
    else if (opened.kind === "separticle")
      table = <TokenTable {...tprops} columns={schema.separticle.map((c) => ({ caption: c.unit ? `${pick(c.label)} (${c.unit})` : pick(c.label), tip: pick(c.label) }))} hint={tt("Secondary particles, read when secondarybeam is 1 in input.txt.")} />;
    else if (opened.kind === "tracewin_lattice") table = <TraceWinTable text={text} schema={schema} />;
    const hasTable = !!table || isLattice;
    const effTab = hasTable ? tab : "text";
    return (
      <div className="file-editor">
        {hasTable && (
          <Tabs
            value={effTab}
            onChange={setTab}
            className="compact-tabs"
            tabs={[
              { value: "table", label: tableTitle(opened.kind), icon: "table" },
              { value: "text", label: tt("Text"), icon: "file-code" },
            ]}
          />
        )}
        {isLattice ? (
          <LatticeEditor
            key={openKey}
            ref={latticeRef}
            initialText={opened.text ?? ""}
            readOnly={readOnly}
            fieldDirs={listing.fieldDirs}
            layout={effTab === "table" ? "structure" : "text"}
            onChange={(v) => edit(v, "text")}
          />
        ) : (
          <>
            {effTab === "table" && table && <div className="file-table">{table}</div>}
            <div className="file-text" style={{ display: effTab === "text" ? "flex" : "none" }}>
              <PlainEditor key={openKey} ref={plainRef} initialText={opened.text ?? ""} readOnly={readOnly} onChange={(v) => edit(v, "text")} />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="page-fill">
      <PageHeader title={tt("Files")} hint={tt("Everything in InputFile/, recognised by content. Every file opens in a view that shows the physical meaning of its values.")} />
      <RunLockBanner />
      <div className="files-layout">
        <div className="files-tree">
          <div className="toolbar compact">
            <span className="caption grow">InputFile</span>
            <IconButton icon="new-file" tip={tt("New file...")} disabled={locked} onClick={newFile} />
            <IconButton icon="cloud-download" tip={tt("Copy files into InputFile...")} disabled={locked} onClick={importFiles} />
            <IconButton icon="refresh" tip={tt("Refresh")} onClick={refresh} />
            <IconButton icon="folder-opened" tip={tt("Open folder")} onClick={() => openPath(listing.dir).catch(reportError)} />
          </div>
          <div className="files-list">
            {groups.map((g) => {
              const isCollapsed = collapsed[g.id] ?? false;
              return (
                <div key={g.id}>
                  <div className="files-group" onClick={() => setCollapsed((c) => ({ ...c, [g.id]: !isCollapsed }))}>
                    <Icon name={isCollapsed ? "chevron-right" : "chevron-down"} />
                    <span className="grow">{tt(g.title)}</span>
                    <span className="badge">{g.files.length}</span>
                  </div>
                  {!isCollapsed &&
                    g.files.map((f) => (
                      <div
                        key={f.path}
                        className={cx("files-item", opened?.path === f.path && "active", !f.editable && "readonly")}
                        onClick={() => select(f)}
                        onContextMenu={(e) => contextMenu(e, f)}
                        data-tip={roleDescription(f, listing.latticeName)}
                      >
                        <Icon name={f.kind === "fieldmap" ? "symbol-field" : f.kind.startsWith("particles") || f.kind === "plt" ? "graph-scatter" : f.kind.includes("lattice") ? "list-ordered" : f.editable ? "file" : "file-binary"} />
                        <span className="grow ellipsis">
                          {f.name}
                          {opened?.path === f.path && dirty ? " •" : ""}
                        </span>
                        <span className="files-size">{humanSize(f.size)}</span>
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        </div>
        <div className="files-content">
          {opened && (
            <div className="files-header">
              <div className="kpi ellipsis">
                {opened.name}
                {dirty ? " •" : ""}
              </div>
              <Badge tone={opened.accent ? "accent" : "neutral"}>{roleLabel(opened.role)}</Badge>
              <div className="grow" />
              {opened.role === "lattice" && (
                <Button icon="play-circle" disabled={locked} onClick={() => useForRun(opened)}>
                  {tt("Use for the run")}
                </Button>
              )}
              {opened.kind === "beam" && <Button onClick={() => setPage("beam")}>{tt("Open Beam page")}</Button>}
              {(opened.kind === "input" || opened.kind === "gui_ini") && <Button onClick={() => setPage("settings")}>{tt("Open Settings page")}</Button>}
              <IconButton icon="ellipsis" tip={tt("More actions")} onClick={(e) => contextMenu(e as any, opened)} />
              <Button variant="ghost" icon="refresh" onClick={async () => (await confirmLeave()) && openFile(opened.path, true)}>
                {tt("Reload")}
              </Button>
              {opened.view === "text" && opened.editable && dirty && (
                <Button variant="primary" icon="save" disabled={locked} tip={tt("Ctrl+S saves all pages")} onClick={() => save().catch(reportError)}>
                  {tt("Save")}
                </Button>
              )}
            </div>
          )}
          {opened && <p className="muted" style={{ margin: "0 0 8px" }}>{roleDescription(opened, listing.latticeName)}</p>}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
