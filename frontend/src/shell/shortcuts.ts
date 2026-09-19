// Every keyboard shortcut in one table.  The menus print `keys`, useShortcuts
// (Shell.tsx) and the form pages match keys against it, and Help ▸ Keyboard
// shortcuts lists it, so the three cannot drift apart.

export type ShortcutId =
  | "newProject"
  | "openProject"
  | "save"
  | "quit"
  | "runPauseResume"
  | "stop"
  | "pages"
  | "sidebar"
  | "log"
  | "assistant"
  | "zoomIn"
  | "zoomOut"
  | "zoomReset"
  | "undo"
  | "redo";

export type Shortcut = {
  id: ShortcutId;
  /** "Ctrl+Shift+A" style; Ctrl also accepts the Cmd key */
  keys: string;
  /** English source text, translate with t() */
  label: string;
  /** where it applies when not everywhere (English source text) */
  scope?: string;
};

export const SHORTCUTS: Shortcut[] = [
  { id: "newProject", keys: "Ctrl+N", label: "New project..." },
  { id: "openProject", keys: "Ctrl+O", label: "Open project..." },
  { id: "save", keys: "Ctrl+S", label: "Save all pages" },
  { id: "quit", keys: "Ctrl+Q", label: "Exit", scope: "desktop window" },
  { id: "runPauseResume", keys: "F5", label: "Run / pause / resume the simulation" },
  { id: "stop", keys: "Shift+F5", label: "Stop the simulation" },
  { id: "pages", keys: "Ctrl+1 … Ctrl+8", label: "Switch to a page (in sidebar order)" },
  { id: "sidebar", keys: "Ctrl+B", label: "Collapse or expand the sidebar" },
  { id: "log", keys: "Ctrl+J", label: "Show or hide the log panel" },
  { id: "assistant", keys: "Ctrl+Shift+A", label: "Show or hide the AI assistant" },
  { id: "zoomIn", keys: "Ctrl+=", label: "Zoom in" },
  { id: "zoomOut", keys: "Ctrl+-", label: "Zoom out" },
  { id: "zoomReset", keys: "Ctrl+0", label: "Reset zoom" },
  { id: "undo", keys: "Ctrl+Z", label: "Undo", scope: "Beam and Settings pages, outside a text box" },
  { id: "redo", keys: "Ctrl+Y", label: "Redo", scope: "Beam and Settings pages, outside a text box" },
];

export const SHORTCUT = Object.fromEntries(SHORTCUTS.map((s) => [s.id, s])) as Record<ShortcutId, Shortcut>;

/** Does *e* match "Ctrl+Shift+A" style *keys*?  Ctrl also matches Cmd; "Ctrl+=" also accepts "+". */
export function keyMatches(e: KeyboardEvent, keys: string): boolean {
  const parts = keys.split("+");
  const key = parts.pop() ?? "";
  const ctrl = parts.includes("Ctrl");
  const shift = parts.includes("Shift");
  const alt = parts.includes("Alt");
  if ((e.ctrlKey || e.metaKey) !== ctrl || e.altKey !== alt) return false;
  if (key === "=") return e.key === "=" || e.key === "+";
  if (e.shiftKey !== shift) return false;
  return key.length === 1 ? e.key.toLowerCase() === key.toLowerCase() : e.key === key;
}
