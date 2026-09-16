// Editable pages register a controller so the shell can save, validate and
// ask about unsaved changes (Ctrl+S, Run, closing the window, opening a project).
import { create } from "zustand";

export type PageController = {
  id: string;
  /** Short name shown in "unsaved changes" questions, e.g. "beam.txt". */
  label: () => string;
  isDirty: () => boolean;
  save: () => Promise<void>;
  /** Problems that block a run (already translated). */
  validate?: () => string[];
  /** Re-read from disk (after the project changed or another page wrote the file). */
  reload?: () => Promise<void>;
};

const controllers = new Map<string, PageController>();

export const useDirty = create<{ dirty: Record<string, boolean>; set: (id: string, d: boolean) => void }>((set) => ({
  dirty: {},
  set: (id, d) => set((s) => (s.dirty[id] === d ? s : { dirty: { ...s.dirty, [id]: d } })),
}));

export function registerPage(ctrl: PageController): () => void {
  controllers.set(ctrl.id, ctrl);
  return () => {
    if (controllers.get(ctrl.id) === ctrl) controllers.delete(ctrl.id);
    useDirty.getState().set(ctrl.id, false);
  };
}

export function markDirty(id: string, dirty: boolean) {
  useDirty.getState().set(id, dirty);
}

export function dirtyPages(): PageController[] {
  return [...controllers.values()].filter((c) => c.isDirty());
}

export function allPages(): PageController[] {
  return [...controllers.values()];
}

export function getPage(id: string): PageController | undefined {
  return controllers.get(id);
}

/** Files written by one page: other pages showing the same file reload (or warn). */
type FileListener = (path: string, source: string) => void;
const fileListeners = new Set<FileListener>();
export function onFileSaved(fn: FileListener): () => void {
  fileListeners.add(fn);
  return () => fileListeners.delete(fn);
}
export function fileSaved(path: string, source: string) {
  for (const fn of fileListeners) fn(path, source);
}
