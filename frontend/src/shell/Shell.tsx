// Window chrome: menu bar, tool bar, side bar, page area, log panel, status bar.
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import {
  closeProject,
  isTyping,
  newProject,
  openProject,
  quit,
  runSimulation,
  saveAll,
  showAbout,
  stopSimulation,
  blockedByDialog,
} from "../actions";
import { closeMenu, openMenuBelow, type MenuItem } from "../components/overlays";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { cx, Icon, IconButton, Spinner } from "../components/ui";
import { LANGUAGES, useT, type Language } from "../i18n";
import {
  PAGES,
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
import { fmtSeconds } from "../format";
import { useLang } from "../i18n";

const ProjectPage = lazy(() => import("../pages/ProjectPage"));
const BeamPage = lazy(() => import("../pages/BeamPage"));
const LatticePage = lazy(() => import("../pages/LatticePage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const FilesPage = lazy(() => import("../pages/FilesPage"));
const RunPage = lazy(() => import("../pages/RunPage"));
const ResultsPage = lazy(() => import("../pages/ResultsPage"));

const PAGE_META: Record<PageId, { label: string; icon: string; render: () => ReactNode }> = {
  project: { label: "Project", icon: "home", render: () => <ProjectPage /> },
  beam: { label: "Beam", icon: "pulse", render: () => <BeamPage /> },
  lattice: { label: "Lattice", icon: "list-ordered", render: () => <LatticePage /> },
  settings: { label: "Settings", icon: "settings-gear", render: () => <SettingsPage /> },
  files: { label: "Files", icon: "files", render: () => <FilesPage /> },
  run: { label: "Run", icon: "play-circle", render: () => <RunPage /> },
  results: { label: "Results", icon: "graph-line", render: () => <ResultsPage /> },
};

const COLLAPSED_WIDTH = 48;
const MIN_WIDTH = 160;
const MAX_WIDTH = 480;
const SNAP_WIDTH = 110;

/* ------------------------------------------------------------------ menu bar */
function MenuBar() {
  const t = useT();
  const app = useApp();
  const lang = useLang((s) => s.lang);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const open = app.project.open;
  const running = app.run.running;

  const menus: { label: string; items: () => MenuItem[] }[] = [
    {
      label: t("File"),
      items: () => [
        { label: t("New project..."), shortcut: "Ctrl+N", icon: "new-folder", onClick: newProject },
        { label: t("Open project..."), shortcut: "Ctrl+O", icon: "folder-opened", onClick: () => openProject() },
        {
          label: t("Open recent"),
          disabled: !app.project.recent.length,
          submenu: app.project.recent.map((p) => ({ label: p, onClick: () => openProject(p) })),
        },
        { label: t("Close project"), disabled: !open, onClick: closeProject },
        { type: "separator" },
        { label: t("Save"), shortcut: "Ctrl+S", icon: "save", disabled: !open, onClick: () => saveAll() },
        { type: "separator" },
        { label: t("Exit"), shortcut: "Ctrl+Q", onClick: quit },
      ],
    },
    {
      label: t("Run"),
      items: () => [
        { label: t("Run simulation"), shortcut: "F5", icon: "play", disabled: !open || running, onClick: runSimulation },
        { label: t("Stop"), shortcut: "Shift+F5", icon: "debug-stop", disabled: !running, onClick: stopSimulation },
      ],
    },
    {
      label: t("View"),
      items: () => [
        ...PAGES.map((p, i) => ({ label: t(PAGE_META[p].label), shortcut: `Ctrl+${i + 1}`, checked: app.page === p, onClick: () => setPage(p) })),
        { type: "separator" as const },
        { label: t("Collapse sidebar"), shortcut: "Ctrl+B", checked: app.sidebarCollapsed, onClick: () => setSidebarCollapsed(!app.sidebarCollapsed) },
        { label: t("Show log panel"), shortcut: "Ctrl+J", checked: app.logVisible, onClick: () => setLogVisible(!app.logVisible) },
        { type: "separator" as const },
        {
          label: t("Theme"),
          submenu: (["system", "light", "dark"] as const).map((m) => ({
            label: m === "system" ? t("Follow system") : m === "light" ? t("Light") : t("Dark"),
            checked: app.theme === m,
            onClick: () => setTheme(m),
          })),
        },
        {
          label: t("UI scale"),
          submenu: [
            ...SCALES.map((s) => ({ label: `${s} %`, checked: app.scale === s, onClick: () => setScale(s) })),
            { type: "separator" as const },
            { label: t("Zoom in"), shortcut: "Ctrl+=", onClick: () => stepScale(1) },
            { label: t("Zoom out"), shortcut: "Ctrl+-", onClick: () => stepScale(-1) },
            { label: t("Reset zoom"), shortcut: "Ctrl+0", onClick: () => setScale(100) },
          ],
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
      ],
    },
    { label: t("Help"), items: () => [{ label: t("About AVAS"), icon: "info", onClick: showAbout }] },
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
      <div className="menubar-title ellipsis">{app.project.open ? `${app.project.name} — AVAS` : "AVAS"}</div>
      <div className="grow" />
      <div className="toolbar-actions">
        <IconButton icon="folder-opened" tip={`${t("Open project...")}  (Ctrl+O)`} onClick={() => openProject()} />
        <IconButton icon="save" tip={`${t("Save")}  (Ctrl+S)`} disabled={!open} onClick={() => saveAll()} />
        <div className="divider-v" />
        <IconButton icon="play" className="run-btn" tip={`${t("Run simulation")}  (F5)`} disabled={!open || running} onClick={runSimulation} />
        <IconButton icon="debug-stop" className="stop-btn" tip={`${t("Stop")}  (Shift+F5)`} disabled={!running} onClick={stopSimulation} />
        <div className="divider-v" />
        <IconButton
          icon={app.sidebarCollapsed ? "layout-sidebar-left-off" : "layout-sidebar-left"}
          tip={t("Toggle sidebar (Ctrl+B)")}
          onClick={() => setSidebarCollapsed(!app.sidebarCollapsed)}
        />
        <IconButton icon={app.logVisible ? "layout-panel" : "layout-panel-off"} tip={t("Toggle log panel (Ctrl+J)")} onClick={() => setLogVisible(!app.logVisible)} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ side bar */
function Sidebar() {
  const t = useT();
  const page = useApp((s) => s.page);
  const collapsed = useApp((s) => s.sidebarCollapsed);
  const running = useApp((s) => s.run.running);
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
            className={cx("nav-item", page === p && "active", needsProject && !projectOpen && "dim")}
            data-tip={collapsed ? t(meta.label) : undefined}
            onClick={() => {
              if (page === p && collapsed) setSidebarCollapsed(false);
              else setPage(p);
            }}
          >
            {busy ? <Spinner size={20} /> : <Icon name={meta.icon} />}
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
    if (run.step != null && run.all_step) parts.push(`${run.step}/${run.all_step}`);
    if (run.eta_s != null) parts.push(t("{time} left", { time: fmtSeconds(run.eta_s) }));
    message = [t("Simulation running"), ...parts].join("  ·  ");
  }
  return (
    <div className={cx("statusbar", run.running && "running")}>
      <button className="status-item" data-tip={project.open ? project.path : t("Open or create a project")} onClick={() => setPage("project")}>
        <Icon name="root-folder" />
        <span>{project.open ? project.name : t("No project")}</span>
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
        <button className="status-item" onClick={() => setPage("run")}>
          <Spinner size={14} />
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
      if (blockedByDialog()) return;
      const ctrl = e.ctrlKey || e.metaKey;
      const app = useApp.getState();
      const key = e.key.toLowerCase();
      let handled = true;
      if (e.key === "F5" && e.shiftKey) stopSimulation();
      else if (e.key === "F5") runSimulation();
      else if (ctrl && !e.shiftKey && key === "s") saveAll();
      else if (ctrl && key === "o") openProject();
      else if (ctrl && key === "n") newProject();
      else if (ctrl && key === "q") quit();
      else if (ctrl && key === "b") setSidebarCollapsed(!app.sidebarCollapsed);
      else if (ctrl && key === "j") setLogVisible(!app.logVisible);
      else if (ctrl && (key === "=" || key === "+")) stepScale(1);
      else if (ctrl && key === "-") stepScale(-1);
      else if (ctrl && key === "0") setScale(100);
      else if (ctrl && !e.shiftKey && !e.altKey && /^[1-7]$/.test(e.key) && !isTyping(e)) setPage(PAGES[Number(e.key) - 1]);
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
      </div>
      <StatusBar />
    </div>
  );
}
