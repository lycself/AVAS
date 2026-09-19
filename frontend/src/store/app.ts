// Global application state: preferences, project summary, simulation state.
import { create } from "zustand";
import { call, isDesktop, on } from "../bridge";
import { applyZoom } from "../host";
import { useLang, type Language } from "../i18n";
import { initLive } from "./live";

export type ThemeMode = "system" | "light" | "dark";
export type PageId = "project" | "beam" | "lattice" | "settings" | "files" | "run" | "results";
export const PAGES: PageId[] = ["project", "beam", "lattice", "settings", "files", "run", "results"];
export const SCALES = [90, 100, 110, 125, 150];

export type RunInfo = {
  status?: string;
  started?: string;
  finished?: string;
  mode?: string;
  elapsed_s?: number;
  error?: string;
  [k: string]: unknown;
};

export type ProjectSummary = {
  open: boolean;
  path?: string;
  name?: string;
  inputDir?: string;
  outputDir?: string;
  latticeName?: string;
  latticePath?: string;
  fieldDirs?: string[];
  inputs?: { name: string; exists: boolean }[];
  outputFiles?: number;
  outputDirs?: number;
  lastRun?: RunInfo;
  recent: string[];
  lastDir?: string;
};

export type RunState = {
  running: boolean;
  paused?: boolean;
  /** project: normal run; segment: part of the lattice; assistant: the assistant's sandbox study */
  source?: "project" | "segment" | "assistant";
  label?: string;
  outputDir?: string;
  stage?: number;
  stages?: number;
  stageLabel?: string;
  mode?: string;
  percent?: number;
  eta_s?: number | null;
  run_s?: number | null;
  pos_m?: number | null;
  /** macro-particles still in the beam (engine progress line) */
  alive?: number | null;
  elapsed_s?: number;
  step?: number | null;
  all_step?: number | null;
  line?: string;
  ok?: boolean;
  message?: string;
  stopped?: boolean;
};

/**
 * Input files are read-only while a project run, error study or segment run is
 * running or paused (they may read the inputs again later); the assistant's
 * sandbox studies work on copies and do not lock.  The back end refuses writes
 * too (avas/gui/locks.py).
 */
export function inputsLocked(run: RunState): boolean {
  return !!run.running && run.source !== "assistant";
}

export function useInputsLocked(): boolean {
  return useApp((s) => inputsLocked(s.run));
}

type Settings = Record<string, any>;

type AppState = {
  ready: boolean;
  version: string;
  settings: Settings;
  systemDark: boolean;
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  scale: number;
  page: PageId;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  logVisible: boolean;
  logHeight: number;
  logMaximized: boolean;
  project: ProjectSummary;
  run: RunState;
  lastFinished: RunState | null;
  statusMessage: { text: string; level: "info" | "warning" | "error" } | null;
  logCounts: { errors: number; warnings: number };
  /** results folder the Results page should switch to (set by "Show results" of a segment run) */
  resultsRequest: { outputDir: string | undefined; nonce: number } | null;
};

export const useApp = create<AppState>(() => ({
  ready: false,
  version: "",
  settings: {},
  systemDark: false,
  theme: "system",
  resolvedTheme: "light",
  scale: 100,
  page: "project",
  sidebarCollapsed: false,
  sidebarWidth: 220,
  logVisible: true,
  logHeight: 200,
  logMaximized: false,
  project: { open: false, recent: [] },
  run: { running: false },
  lastFinished: null,
  statusMessage: null,
  logCounts: { errors: 0, warnings: 0 },
  resultsRequest: null,
}));

const set = useApp.setState;
const get = useApp.getState;

/* ------------------------------------------------------------------ persistence */
let saveTimer = 0;
const pending: Settings = {};
export function persist(values: Settings) {
  Object.assign(pending, values);
  set((s) => ({ settings: { ...s.settings, ...values } }));
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    const batch = { ...pending };
    for (const k of Object.keys(pending)) delete pending[k];
    call("settings.set", { values: batch }).catch(() => undefined);
  }, 250);
}

/* ------------------------------------------------------------------ theme */
const media = window.matchMedia("(prefers-color-scheme: dark)");

function resolve(mode: ThemeMode, systemDark: boolean): "light" | "dark" {
  return mode === "system" ? (systemDark ? "dark" : "light") : mode;
}

function applyTheme() {
  const { theme, systemDark } = get();
  const resolved = resolve(theme, systemDark);
  document.documentElement.setAttribute("data-theme", resolved);
  try {
    localStorage.setItem("avas.theme", theme);
  } catch {
    /* storage unavailable */
  }
  if (resolved !== get().resolvedTheme) set({ resolvedTheme: resolved });
  call("app.titleBar", { dark: resolved === "dark" }).catch(() => undefined);
}

export function setTheme(mode: ThemeMode) {
  set({ theme: mode });
  persist({ "ui/theme": mode });
  applyTheme();
}

export function toggleTheme() {
  setTheme(get().resolvedTheme === "dark" ? "light" : "dark");
}

media.addEventListener("change", (e) => {
  set({ systemDark: e.matches });
  applyTheme();
});

/* ------------------------------------------------------------------ scale / language */
export function setScale(scale: number) {
  const nearest = SCALES.reduce((a, b) => (Math.abs(b - scale) < Math.abs(a - scale) ? b : a));
  set({ scale: nearest });
  persist({ "ui/uiScale": nearest });
  applyZoom(nearest / 100);
}

export function stepScale(direction: 1 | -1) {
  const idx = SCALES.indexOf(get().scale);
  const next = SCALES[Math.max(0, Math.min(SCALES.length - 1, (idx < 0 ? 1 : idx) + direction))];
  setScale(next);
}

export function setLanguage(lang: Language) {
  useLang.getState().setLang(lang);
  document.documentElement.lang = lang === "zh_CN" ? "zh-CN" : "en";
  persist({ "ui/language": lang });
}

/* ------------------------------------------------------------------ layout */
export function setPage(page: PageId) {
  set({ page });
  persist({ "ui/lastPage": page });
}

/** Open the Results page on *outputDir* (undefined: the project's OutputFile). */
export function showResults(outputDir?: string) {
  set({ resultsRequest: { outputDir, nonce: Date.now() } });
  setPage("results");
}

export function setSidebarCollapsed(collapsed: boolean) {
  set({ sidebarCollapsed: collapsed });
  persist({ "ui/sidebarCollapsed": collapsed });
}

export function setSidebarWidth(width: number) {
  set({ sidebarWidth: width });
  persist({ "ui/sidebarWidth": width });
}

export function setLogVisible(visible: boolean) {
  set({ logVisible: visible, logMaximized: visible ? get().logMaximized : false });
  persist({ "ui/logCollapsed": !visible });
}

export function setLogHeight(height: number) {
  set({ logHeight: height, logMaximized: false });
  persist({ "ui/logHeight": height });
}

export function setLogMaximized(maximized: boolean) {
  if (maximized && !get().logVisible) setLogVisible(true);
  set({ logMaximized: maximized });
}

export function showStatus(text: string, level: "info" | "warning" | "error" = "info") {
  set({ statusMessage: text ? { text, level } : null });
}

/* ------------------------------------------------------------------ project */
export function setProject(summary: ProjectSummary) {
  set({ project: summary });
}

export async function refreshProject() {
  const summary = await call<ProjectSummary>("project.summary");
  setProject(summary);
  return summary;
}

/* ------------------------------------------------------------------ startup */
export async function initApp() {
  const info = await call<any>("app.info");
  const s = info.settings as Settings;
  const lang = (s["ui/language"] === "zh_CN" ? "zh_CN" : "en") as Language;
  useLang.getState().setLang(lang);
  document.documentElement.lang = lang === "zh_CN" ? "zh-CN" : "en";
  set({
    version: info.version,
    settings: s,
    systemDark: media.matches,
    theme: (["system", "light", "dark"].includes(s["ui/theme"]) ? s["ui/theme"] : "system") as ThemeMode,
    scale: SCALES.includes(s["ui/uiScale"]) ? s["ui/uiScale"] : 100,
    sidebarCollapsed: !!s["ui/sidebarCollapsed"],
    sidebarWidth: Math.max(160, Math.min(480, Number(s["ui/sidebarWidth"]) || 220)),
    logVisible: !s["ui/logCollapsed"],
    logHeight: Math.max(80, Number(s["ui/logHeight"]) || 200),
  });
  applyTheme();
  if (!isDesktop()) applyZoom(get().scale / 100); // the window applies its zoom itself when the page has loaded
  on("project", (summary: ProjectSummary) => setProject(summary));
  on("run.progress", (state: RunState) => set({ run: state }));
  on("run.finished", (state: RunState) => set({ run: { ...state, running: false }, lastFinished: state }));
  // events emitted while the WebSocket was down are lost: fetch what they would have told us
  on("bridge.reconnected", async () => {
    try {
      set({ run: await call<RunState>("run.state") });
      setProject(await call<ProjectSummary>("project.summary"));
    } catch {
      /* the back end is gone; the next call reports it */
    }
  });
  initLive();
  const run = await call<RunState>("run.state");
  set({ run });
  const summary = await call<ProjectSummary>("project.restoreLast");
  setProject(summary);
  const last = s["ui/lastPage"] as PageId;
  set({ page: summary.open && PAGES.includes(last) ? last : "project", ready: true });
}
