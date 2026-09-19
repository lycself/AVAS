// Load / edit / dirty / save plumbing shared by the form pages, with a bounded
// undo history (Ctrl+Z / Ctrl+Y while the page is shown and no text box has the focus).
import { useCallback, useEffect, useRef, useState } from "react";
import { blockedByDialog, isTyping } from "../actions";
import { reportError } from "../components/overlays";
import { keyMatches, SHORTCUT } from "../shell/shortcuts";
import { inputsLocked, useApp } from "../store/app";
import { markDirty, onFileSaved, registerPage } from "../store/pages";

type Options<T> = {
  id: string;
  label: () => string;
  load: () => Promise<T>;
  save: (value: T) => Promise<T | void>;
  validate?: (value: T) => string[];
  /** Absolute paths this page writes; a save of one of them elsewhere reloads the page. */
  files?: (value: T | null) => string[];
};

const HISTORY_MAX = 100;
/** edits closer together than this (typing in one field) form one undo step */
const COALESCE_MS = 300;

function same(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useEditable<T>(opts: Options<T>) {
  const projectPath = useApp((s) => (s.project.open ? s.project.path : null));
  const shown = useApp((s) => s.page === opts.id);
  const [value, setValueState] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saved = useRef<T | null>(null);
  const current = useRef<T | null>(null);
  const history = useRef<{ past: T[]; future: T[]; lastEdit: number }>({ past: [], future: [], lastEdit: 0 });
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const dirty = value !== null && saved.current !== null && !same(value, saved.current);

  const clearHistory = () => {
    history.current = { past: [], future: [], lastEdit: 0 };
  };

  /** Make *next* the current value; *step* records the previous value as an undo step. */
  const commit = useCallback((next: T, step: "new" | "coalesce" | "none") => {
    const prev = current.current;
    const h = history.current;
    if (step !== "none" && prev !== null) {
      const now = Date.now();
      if (!(step === "coalesce" && now - h.lastEdit < COALESCE_MS && h.past.length)) {
        h.past.push(prev);
        if (h.past.length > HISTORY_MAX) h.past.shift();
      }
      h.future = [];
      h.lastEdit = now;
    }
    current.current = next;
    setValueState(next);
    markDirty(optsRef.current.id, !same(next, saved.current));
  }, []);

  const setValue = useCallback(
    (update: T | ((prev: T) => T)) => {
      const prev = current.current;
      if (prev === null) return;
      const next = typeof update === "function" ? (update as (p: T) => T)(prev) : update;
      commit(next, "coalesce");
    },
    [commit],
  );

  const undo = useCallback(() => {
    const h = history.current;
    const prev = h.past.pop();
    if (prev === undefined || current.current === null) return;
    h.future.push(current.current);
    h.lastEdit = 0;
    commit(prev, "none");
  }, [commit]);

  const redo = useCallback(() => {
    const h = history.current;
    const next = h.future.pop();
    if (next === undefined || current.current === null) return;
    h.past.push(current.current);
    h.lastEdit = 0;
    commit(next, "none");
  }, [commit]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const v = await optsRef.current.load();
      saved.current = v;
      current.current = v;
      clearHistory();
      setValueState(v);
      setError(null);
      markDirty(optsRef.current.id, false);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      saved.current = null;
      current.current = null;
      clearHistory();
      setValueState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async () => {
    const v = current.current;
    if (v === null) return;
    const result = await optsRef.current.save(v);
    const next = (result ?? v) as T;
    saved.current = next;
    // keep edits made while saving
    if (same(current.current, v)) {
      current.current = next;
      setValueState(next);
    }
    markDirty(optsRef.current.id, !same(current.current, next));
  }, []);

  useEffect(() => {
    if (!projectPath) {
      saved.current = null;
      current.current = null;
      clearHistory();
      setValueState(null);
      markDirty(optsRef.current.id, false);
      return;
    }
    reload();
  }, [projectPath, reload]);

  useEffect(
    () =>
      registerPage({
        id: opts.id,
        label: () => optsRef.current.label(),
        isDirty: () => current.current !== null && saved.current !== null && !same(current.current, saved.current),
        save,
        validate: () => (current.current !== null && optsRef.current.validate ? optsRef.current.validate(current.current) : []),
        reload,
      }),
    [opts.id, save, reload],
  );

  useEffect(
    () =>
      onFileSaved((path, source) => {
        if (source === opts.id || !optsRef.current.files) return;
        const mine = optsRef.current.files(current.current).map((p) => p.toLowerCase());
        if (!mine.includes(path.toLowerCase())) return;
        const isDirty = current.current !== null && saved.current !== null && !same(current.current, saved.current);
        if (!isDirty) reload();
      }),
    [opts.id, reload],
  );

  // Ctrl+Z / Ctrl+Y while this page is shown; inside a text box the box's own undo wins
  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e) || blockedByDialog() || inputsLocked(useApp.getState().run)) return;
      if (keyMatches(e, SHORTCUT.undo.keys)) undo();
      else if (keyMatches(e, SHORTCUT.redo.keys) || keyMatches(e, "Ctrl+Shift+Z")) redo();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, undo, redo]);

  const saveNow = useCallback(async () => {
    try {
      await save();
      return true;
    } catch (e) {
      reportError(e);
      return false;
    }
  }, [save]);

  /** Back to the saved state (one undo step). */
  const revert = useCallback(() => {
    if (saved.current === null) return;
    commit(saved.current, "new");
  }, [commit]);

  return { value, setValue, dirty, loading, error, reload, saveNow, revert, undo, redo, canUndo: history.current.past.length > 0, canRedo: history.current.future.length > 0 };
}
