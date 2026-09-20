import { pointerDevice } from "../components/pointer";
// Window chrome: menu bar, tool bar, side bar, page area, log panel, status bar.
import { checkUpdates, UpdateNotice } from "../updates";
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import {
  closeProject,
  isTyping,
  newProject,
  openManual,
  openProject,
  pauseSimulation,
  projectMenuItems,
  quit,
  resumeSimulation,
  revealProject,
  runPauseResume,
  runSimulation,
  saveAll,
  showAbout,
  stopSimulation,
  blockedByDialog,
} from "../actions";
import { closeMenu, DialogFrame, openMenu, openMenuBelow, showDialog, type MenuItem } from "../components/overlays";
import { canQuit } from "../host";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Button, cx, Icon, IconButton, Spinner } from "../components/ui";
import { LANGUAGES, t as tr, useT, type Language } from "../i18n";
import { keyMatches, SHORTCUT, SHORTCUTS, type ShortcutId } from "./shortcuts";
import {
  PAGES,
  persist,
  SCALES,
  setLanguage,
  setLogHeight,
  setLogMaximized,
  setLogVisible,
  setPage,
  setScale,
  setSidebarCollapsed,
  setSidebarWidth,
  setTheme,
  stepScale,
  toggleTheme,
  useApp,
  type PageId,
} from "../store/app";
import { useDirty } from "../store/pages";
import { LogPanel, useLog } from "./LogPanel";
import { setAssistantOpen, setAssistantWidth, useAssistant } from "../assistant/store";
const AssistantPanel = lazy(() => import("../assistant/AssistantPanel").then((m) => ({ default: m.AssistantPanel })));
import { fmtSeconds } from "../format";
import { useLang } from "../i18n";

const ProjectPage = lazy(() => import("../pages/ProjectPage"));
const BeamPage = lazy(() => import("../pages/BeamPage"));
const LatticePage = lazy(() => import("../pages/LatticePage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const FilesPage = lazy(() => import("../pages/FilesPage"));
const RunPage = lazy(() => import("../pages/RunPage"));
const ResultsPage = lazy(() => import("../pages/ResultsPage"));
const ScanPage = lazy(() => import("../pages/ScanPage"));

const PAGE_META: Record<PageId, { label: string; icon: string; render: () => ReactNode }> = {
  project: { label: "Project", icon: "home", render: () => <ProjectPage /> },
  beam: { label: "Beam", icon: "pulse", render: () => <BeamPage /> },
  lattice: { label: "Lattice", icon: "list-ordered", render: () => <LatticePage /> },
  settings: { label: "Settings", icon: "settings-gear", render: () => <SettingsPage /> },
  files: { label: "Files", icon: "files", render: () => <FilesPage /> },
  run: { label: "Run", icon: "play-circle", render: () => <RunPage /> },
  scan: { label: "Scan", icon: "graph-scatter", render: () => <ScanPage /> },
  results: { label: "Results", icon: "graph-line", render: () => <ResultsPage /> },
};

const COLLAPSED_WIDTH = 48;
const MIN_WIDTH = 160;
const MAX_WIDTH = 480;
const SNAP_WIDTH = 110;

function toggleSidebar() {
  setSidebarCollapsed(!useApp.getState().sidebarCollapsed);
}


/* ------------------------------------------------------------------ menu bar */
/** Help ▸ Keyboard shortcuts: the table comes from the same list the menus and handlers use. */
function showShortcuts() {
  return showDialog<void>(
    (close) => (
      <DialogFrame
        title={tr("Keyboard shortcuts")}
        icon="keyboard"
        onClose={() => close()}
        footer={
          <Button variant="primary" autoFocus onClick={() => close()}>
            {tr("Close")}
          </Button>
        }
      >
        <table className="shortcut-table">
          <thead>
            <tr>
              <th>{tr("Action")}</th>
              <th>{tr("Shortcut")}</th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map((s) => (
              <tr key={s.id}>
                <td>
                  {tr(s.label)}
                  {s.scope && <span className="soft"> · {tr(s.scope)}</span>}
                </td>
                <td>
                  <span className="kbd">{s.keys}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DialogFrame>
    ),
    { width: 520 },
  );
}

function MenuBar() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  // narrow selectors: the menu bar must not re-render on every run.progress event
  const open = useApp((s) => s.project.open);
  const projectName = useApp((s) => s.project.name);
  const projectPath = useApp((s) => s.project.path);
  const recent = useApp((s) => s.project.recent);
  const running = useApp((s) => s.run.running);
  const paused = useApp((s) => s.run.running && !!s.run.paused);
  const page = useApp((s) => s.page);
  const sidebarCollapsed = useApp((s) => s.sidebarCollapsed);
  const logVisible = useApp((s) => s.logVisible);
  const theme = useApp((s) => s.theme);
  const scale = useApp((s) => s.scale);
  const pointer = useApp((s) => pointerDevice(s.settings));
  const motion = useApp((s) => s.settings["ui/motion"] ?? "full");
  const anyDirty = useDirty((s) => Object.values(s.dirty).some(Boolean));

  useEffect(() => {
    document.title = open && projectName ? `AVAS – ${projectName}` : "AVAS";
  }, [open, projectName]);

  const menus: { label: string; items: () => MenuItem[] }[] = [
    {
      label: t("File"),
      items: () => [
        { label: t("New project..."), shortcut: SHORTCUT.newProject.keys, icon: "new-folder", onClick: newProject },
        { label: t("Open project..."), shortcut: SHORTCUT.openProject.keys, icon: "folder-opened", onClick: () => openProject() },
        {
          label: t("Open recent"),
          disabled: !recent.length,
          submenu: recent.map((p) => ({ label: p, onClick: () => openProject(p) })),
        },
        { label: t("Close project"), disabled: !open, onClick: closeProject },
        { type: "separator" },
        { label: t("Project overview"), icon: "home", disabled: !open, onClick: () => setPage("project") },
        { label: t("Show in Explorer"), icon: "folder", disabled: !open, onClick: revealProject },
        { type: "separator" },
        { label: t("Save"), shortcut: SHORTCUT.save.keys, icon: "save", disabled: !open, onClick: () => saveAll() },
        ...(canQuit() ? [{ type: "separator" } as const, { label: t("Exit"), shortcut: SHORTCUT.quit.keys, onClick: quit }] : []),
      ],
    },
    {
      label: t("Run"),
      items: () => [
        !running
          ? { label: t("Run simulation"), shortcut: SHORTCUT.runPauseResume.keys, icon: "play", disabled: !open, onClick: runSimulation }
          : paused
            ? { label: t("Resume"), shortcut: SHORTCUT.runPauseResume.keys, icon: "debug-continue", onClick: resumeSimulation }
            : { label: t("Pause"), shortcut: SHORTCUT.runPauseResume.keys, icon: "debug-pause", onClick: pauseSimulation },
        { label: t("Stop"), shortcut: SHORTCUT.stop.keys, icon: "debug-stop", disabled: !running, onClick: stopSimulation },
      ],
    },
    {
      label: t("View"),
      items: () => [
        ...PAGES.map((p, i) => ({ label: t(PAGE_META[p].label), shortcut: `Ctrl+${i + 1}`, checked: page === p, onClick: () => setPage(p) })),
        { type: "separator" as const },
        { label: t("Collapse sidebar"), shortcut: SHORTCUT.sidebar.keys, checked: sidebarCollapsed, onClick: toggleSidebar },
        { label: t("Show log panel"), shortcut: SHORTCUT.log.keys, checked: logVisible, onClick: () => setLogVisible(!logVisible) },
        { label: t("AI assistant"), shortcut: SHORTCUT.assistant.keys, checked: useAssistant.getState().open, onClick: () => setAssistantOpen(!useAssistant.getState().open) },
        { type: "separator" as const },
        {
          label: t("Theme"),
          submenu: (["system", "light", "dark"] as const).map((m) => ({
            label: m === "system" ? t("Follow system") : m === "light" ? t("Light") : t("Dark"),
            checked: theme === m,
            onClick: () => setTheme(m),
          })),
        },
        {
          label: t("UI scale"),
          submenu: [
            ...SCALES.map((s) => ({ label: `${s} %`, checked: scale === s, onClick: () => setScale(s) })),
            { type: "separator" as const },
            { label: t("Zoom in"), shortcut: SHORTCUT.zoomIn.keys, onClick: () => stepScale(1) },
            { label: t("Zoom out"), shortcut: SHORTCUT.zoomOut.keys, onClick: () => stepScale(-1) },
            { label: t("Reset zoom"), shortcut: SHORTCUT.zoomReset.keys, onClick: () => setScale(100) },
          ],
        },
        {
          label: t("Motion"),
          submenu: (
            [
              ["full", t("Full: moving bunch and particle cloud")],
              ["lite", t("Reduced: moving marker only")],
              ["off", t("Off: update once per second")],
              ["auto", t("Automatic (follow Windows animation effects)")],
            ] as const
          ).map(([value, label]) => ({ label, checked: motion === value, onClick: () => persist({ "ui/motion": value }) })),
        },
      ],
    },
    {
      label: t("Settings"),
      items: () => [
        {
          label: t("Language"),
          submenu: (Object.keys(LANGUAGES) as Language[]).map((code) => ({ label: LANGUAGES[code], checked: lang === code, onClick: () => setLanguage(code) })),
        },
        {
          label: t("Pointer device (all plots)"),
          submenu: [
            { label: t("Detect automatically"), checked: pointer === "auto", onClick: () => persist({ "ui/pointerDevice": "auto" }) },
            { label: t("Mouse: the wheel zooms"), checked: pointer === "mouse", onClick: () => persist({ "ui/pointerDevice": "mouse" }) },
            { label: t("Touchpad: two-finger swipe pans"), checked: pointer === "touchpad", onClick: () => persist({ "ui/pointerDevice": "touchpad" }) },
          ],
        },
      ],
    },
    {
      label: t("Help"),
      items: () => [
        { label: t("User manual"), icon: "book", onClick: openManual },
        { label: t("Keyboard shortcuts"), icon: "keyboard", onClick: () => void showShortcuts() },
        { type: "separator" },
        { label: t("About AVAS"), icon: "info", onClick: showAbout },
        { label: t("Check for updates"), icon: "refresh", onClick: checkUpdates },
      ],
    },
  ];

  const show = (i: number) => {
    const el = refs.current[i];
    if (!el) return;
    setOpenIdx(i);
    openMenuBelow(el, menus[i].items(), { onClose: () => setOpenIdx((cur) => (cur === i ? null : cur)) });
  };

  return (
    <div className="menubar">
      <div className="menubar-logo">
        <Icon name="circuit-board" />
      </div>
      {menus.map((m, i) => (
        <button
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={cx("menubar-item", openIdx === i && "open")}
          onMouseDown={(e) => {
            e.preventDefault();
            if (openIdx === i) {
              closeMenu();
              setOpenIdx(null);
            } else show(i);
          }}
          onMouseEnter={() => {
            if (openIdx !== null && openIdx !== i) {
              closeMenu();
              show(i);
            }
          }}
        >
          {m.label}
        </button>
      ))}
      <div className="grow" />
      <div
        className={cx("menubar-title ellipsis", "clickable")}
        data-tip={open ? projectPath : t("Open or create a project")}
        onMouseDown={(e) => {
          e.preventDefault();
          openMenuBelow(e.currentTarget as HTMLElement, projectMenuItems());
        }}
      >
        {open ? `${projectName} — AVAS` : "AVAS"}
      </div>
      <div className="grow" />
      <div className="toolbar-actions">
        <IconButton icon="folder-opened" tip={`${t("Open project...")}  (Ctrl+O)`} onClick={() => openProject()} />
        <IconButton icon="save" tip={anyDirty ? `${t("Save")}  (Ctrl+S)` : t("Nothing to save")} disabled={!open || !anyDirty} onClick={() => saveAll()} />
        <div className="divider-v" />
        <IconButton
          icon={!running ? "play" : paused ? "debug-continue" : "debug-pause"}
          className={cx("run-btn", running && !paused && "pause")}
          tip={`${!running ? t("Run simulation") : paused ? t("Resume") : t("Pause")}  (F5)`}
          disabled={!open && !running}
          onClick={runPauseResume}
        />
        <IconButton icon="debug-stop" className="stop-btn" tip={`${t("Stop")}  (Shift+F5)`} disabled={!running} onClick={stopSimulation} />
        <div className="divider-v" />
        <IconButton
          icon={sidebarCollapsed ? "layout-sidebar-left-off" : "layout-sidebar-left"}
          tip={t("Toggle sidebar (Ctrl+B)")}
          onClick={toggleSidebar}
        />
        <IconButton icon={logVisible ? "layout-panel" : "layout-panel-off"} tip={t("Toggle log panel (Ctrl+J)")} onClick={() => setLogVisible(!logVisible)} />
        <div className="divider-v" />
        <AssistantToggle />
      </div>
    </div>
  );
}

function AssistantToggle() {
  const t = useT();
  const open = useAssistant((s) => s.open);
  const busy = useAssistant((s) => !!s.current?.busy);
  return (
    <button className={cx("assistant-toggle", open && "active")} data-tip={t("AI assistant (Ctrl+Shift+A)")} onClick={() => setAssistantOpen(!open)}>
      {busy ? <Spinner size={14} /> : <Icon name="sparkle" />}
      <span>{t("Assistant")}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ side bar */
function Sidebar() {
  const t = useT();
  const page = useApp((s) => s.page);
  const collapsed = useApp((s) => s.sidebarCollapsed);
  const running = useApp((s) => s.run.running);
  const paused = useApp((s) => !!s.run.paused);
  const version = useApp((s) => s.version);
  const projectOpen = useApp((s) => s.project.open);
  const dirty = useDirty((s) => s.dirty);
  const dirtyByPage: Partial<Record<PageId, boolean>> = { beam: dirty.beam, lattice: dirty.lattice, settings: dirty.settings, files: dirty.files };
  return (
    <nav className={cx("sidebar", collapsed && "collapsed")}>
      <div className="sidebar-header">{!collapsed && <span>AVAS&nbsp;&nbsp;v{version}</span>}</div>
      {PAGES.map((p) => {
        const meta = PAGE_META[p];
        const busy = p === "run" && running;
        const needsProject = p !== "project";
        return (
          <button
            key={p}
            aria-label={t(meta.label)}
            className={cx("nav-item", page === p && "active", needsProject && !projectOpen && "dim")}
            data-tip={collapsed ? t(meta.label) : undefined}
            onClick={() => {
              if (page === p && collapsed) setSidebarCollapsed(false);
              else setPage(p);
            }}
          >
            {busy && paused ? <Icon name="debug-pause" className="nav-paused" /> : busy ? <Spinner size={20} /> : <Icon name={meta.icon} />}
            {!collapsed && <span className="nav-label">{t(meta.label)}</span>}
            {dirtyByPage[p] && <span className="nav-dot" data-tip={t("Unsaved changes")} />}
          </button>
        );
      })}
    </nav>
  );
}

function startDrag(onMove: (dx: number, dy: number) => void, onEnd?: () => void) {
  return (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const x0 = e.clientX;
    const y0 = e.clientY;
    document.body.classList.add("dragging");
    const move = (ev: MouseEvent) => onMove(ev.clientX - x0, ev.clientY - y0);
    const up = () => {
      document.body.classList.remove("dragging");
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      onEnd?.();
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };
}

/* ------------------------------------------------------------------ status bar */
function StatusBar() {
  const t = useT();
  const project = useApp((s) => s.project);
  const run = useApp((s) => s.run);
  const status = useApp((s) => s.statusMessage);
  const resolved = useApp((s) => s.resolvedTheme);
  const errors = useLog((s) => s.errors);
  const warnings = useLog((s) => s.warnings);
  let message = status?.text ?? "";
  if (run.running) {
    const parts = [`${(run.percent ?? 0).toFixed(0)} %`];
    if (run.stages && run.stages > 1) parts.push(`${t("stage")} ${run.stage}/${run.stages}`);
    if (run.step != null && run.all_step) parts.push(`${run.step}/${run.all_step}`);
    if (run.eta_s != null && !run.paused) parts.push(t("{time} left", { time: fmtSeconds(run.eta_s) }));
    const what =
      run.source === "assistant"
        ? t(run.paused ? "Assistant {task} paused" : "Assistant {task} running", { task: t(run.label ?? "") })
        : run.source === "scan"
          ? t(run.paused ? "Parameter scan {task} paused" : "Parameter scan {task} running", { task: run.label ?? "" })
        : run.source === "segment"
          ? t(run.paused ? "Segment {label} paused" : "Segment {label} running", { label: run.label ?? "" })
          : t(run.paused ? "Simulation paused" : "Simulation running");
    message = [what, ...parts].join("  ·  ");
  }
  return (
    <div className={cx("statusbar", run.running && "running")}>
      <button
        className="status-item status-project"
        data-tip={project.open ? `${project.path}
${t("Click to switch project")}` : t("Open or create a project")}
        onClick={(e) => {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          openMenu(projectMenuItems(), r.left, r.top - 4, { anchorBottom: true });
        }}
      >
        <Icon name="root-folder" />
        <span className="ellipsis">{project.open ? project.name : t("No project")}</span>
        <Icon name="chevron-up" style={{ fontSize: 12 }} />
      </button>
      <button className="status-item" data-tip={t("Errors and warnings in the log (click to show the log)")} onClick={() => setLogVisible(true)}>
        <Icon name="error" />
        <span>{errors}</span>
        <Icon name="warning" />
        <span>{warnings}</span>
      </button>
      <div className={cx("status-message ellipsis", !run.running && status?.level === "error" && "error")} data-tip={message || undefined}>
        {message}
      </div>
      {run.running && (
        <button className="status-item" data-tip={t("Show the Run page")} onClick={() => setPage("run")}>
          {run.paused ? <Icon name="debug-pause" /> : <Spinner size={14} />}
        </button>
      )}
      <button className="status-item" data-tip={resolved === "dark" ? t("Switch to light theme") : t("Switch to dark theme")} onClick={toggleTheme}>
        <Icon name="color-mode" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ shortcuts */
function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (blockedByDialog() || (e.target instanceof Element && e.target.closest(".manual-window"))) return;
      const ctrl = e.ctrlKey || e.metaKey;
      const app = useApp.getState();
      const key = e.key.toLowerCase();
      const is = (id: ShortcutId) => keyMatches(e, SHORTCUT[id].keys);
      let handled = true;
      if (is("stop")) stopSimulation();
      else if (is("runPauseResume")) runPauseResume();
      else if (is("save")) saveAll();
      else if (is("openProject")) openProject();
      else if (is("newProject")) newProject();
      else if (is("quit")) quit();
      else if (is("sidebar")) toggleSidebar();
      else if (is("log")) setLogVisible(!app.logVisible);
      else if (is("assistant")) setAssistantOpen(!useAssistant.getState().open);
      else if (is("zoomIn")) stepScale(1);
      else if (is("zoomOut")) stepScale(-1);
      else if (is("zoomReset")) setScale(100);
      else if (ctrl && !e.shiftKey && !e.altKey && /^[1-8]$/.test(e.key) && !isTyping(e)) setPage(PAGES[Number(e.key) - 1]); // SHORTCUT.pages
      else if (e.key === "F12" || (ctrl && e.shiftKey && key === "i")) handled = false;
      else if (ctrl && key === "r" && !isTyping(e)) handled = true; // no page reload
      else if (e.key === "F5" || (ctrl && key === "p") || (ctrl && key === "f" && !isTyping(e))) handled = true;
      else handled = false;
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);
}

/* ------------------------------------------------------------------ shell */
export function Shell() {

  useShortcuts();
  const page = useApp((s) => s.page);
  const collapsed = useApp((s) => s.sidebarCollapsed);
  const width = useApp((s) => s.sidebarWidth);
  const logVisible = useApp((s) => s.logVisible);
  const logHeight = useApp((s) => s.logHeight);
  const logMax = useApp((s) => s.logMaximized);
  const [visited, setVisited] = useState<Set<PageId>>(() => new Set([page]));
  const [liveWidth, setLiveWidth] = useState<number | null>(null);
  const [liveHeight, setLiveHeight] = useState<number | null>(null);
  const assistantOpen = useAssistant((s) => s.open);
  const assistantWidth = useAssistant((s) => s.width);
  const [liveAssistantW, setLiveAssistantW] = useState<number | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisited((v) => (v.has(page) ? v : new Set(v).add(page)));
  }, [page]);

  const sideW = liveWidth ?? (collapsed ? COLLAPSED_WIDTH : width);

  const startSidebarDrag = (() => {
    let start = 0;
    let result = 0;
    return (e: React.MouseEvent) => {
      start = collapsed ? COLLAPSED_WIDTH : width;
      result = start;
      startDrag(
        (dx) => {
          result = start + dx;
          setLiveWidth(Math.max(COLLAPSED_WIDTH, Math.min(MAX_WIDTH, result)));
        },
        () => {
          setLiveWidth(null);
          if (result < SNAP_WIDTH) setSidebarCollapsed(true);
          else {
            setSidebarWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, result)));
            if (collapsed) setSidebarCollapsed(false);
          }
        },
      )(e);
    };
  })();

  const startLogDrag = (() => {
    let start = 0;
    let result = 0;
    return (e: React.MouseEvent) => {
      const total = mainRef.current?.clientHeight ?? 800;
      start = logMax ? total - 120 : logHeight;
      result = start;
      startDrag(
        (_dx, dy) => {
          result = Math.max(60, Math.min(total - 120, start - dy));
          setLiveHeight(result);
        },
        () => {
          setLiveHeight(null);
          if (result < 60) setLogVisible(false);
          else setLogHeight(Math.round(result));
        },
      )(e);
    };
  })();

  const panelStyle = logMax ? { flex: "1 1 auto" } : { height: liveHeight ?? logHeight };

  const startAssistantDrag = (e: React.MouseEvent) => {
    const start = assistantWidth;
    let result = start;
    startDrag(
      (dx) => {
        result = Math.max(320, Math.min(Math.round(window.innerWidth * 0.6), start - dx));
        setLiveAssistantW(result);
      },
      () => {
        setLiveAssistantW(null);
        setAssistantWidth(result);
      },
    )(e);
  };

  return (
    <div className="shell">
      <MenuBar />
      <div className="shell-body">
        <div className="sidebar-wrap" style={{ width: sideW }}>
          <Sidebar />
        </div>
        <div
          className="sash sash-v"
          onMouseDown={startSidebarDrag}
          onDoubleClick={() => setSidebarCollapsed(!collapsed)}
        />
        <div className="main" ref={mainRef}>
          <div className="pages" style={logMax && logVisible ? { flex: "0 0 120px" } : undefined}>
            {[...visited].map((p) => (
              <div key={p} className="page-host" style={{ display: p === page ? undefined : "none" }}>
                <ErrorBoundary name={p}>
                  <Suspense fallback={<div className="page-loading"><Spinner size={24} /></div>}>{PAGE_META[p].render()}</Suspense>
                </ErrorBoundary>
              </div>
            ))}
          </div>
          {logVisible && (
            <>
              <div className="sash sash-h" onMouseDown={startLogDrag} onDoubleClick={() => setLogMaximized(!logMax)} />
              <div className="panel" style={panelStyle}>
                <LogPanel />
              </div>
            </>
          )}
        </div>
        {assistantOpen && (
          <>
            <div className="sash sash-v" onMouseDown={startAssistantDrag} />
            <div className="assistant-wrap" style={{ width: liveAssistantW ?? assistantWidth }}>
              <ErrorBoundary name="assistant">
                <Suspense fallback={<div className="page-loading"><Spinner size={20} /></div>}>
                  <AssistantPanel />
                </Suspense>
              </ErrorBoundary>
            </div>
          </>
        )}
      </div>
      <UpdateNotice />
      <StatusBar />
    </div>
  );
}
