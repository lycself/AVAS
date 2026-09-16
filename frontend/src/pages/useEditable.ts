// Load / edit / dirty / save plumbing shared by the form pages.
import { useCallback, useEffect, useRef, useState } from "react";
import { reportError } from "../components/overlays";
import { useApp } from "../store/app";
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

function same(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useEditable<T>(opts: Options<T>) {
  const projectPath = useApp((s) => (s.project.open ? s.project.path : null));
  const [value, setValueState] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saved = useRef<T | null>(null);
  const current = useRef<T | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const dirty = value !== null && saved.current !== null && !same(value, saved.current);

  const setValue = useCallback((update: T | ((prev: T) => T)) => {
    setValueState((prev) => {
      if (prev === null) return prev;
      const next = typeof update === "function" ? (update as (p: T) => T)(prev) : update;
      current.current = next;
      markDirty(optsRef.current.id, !same(next, saved.current));
      return next;
    });
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const v = await optsRef.current.load();
      saved.current = v;
      current.current = v;
      setValueState(v);
      setError(null);
      markDirty(optsRef.current.id, false);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      saved.current = null;
      current.current = null;
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

  const saveNow = useCallback(async () => {
    try {
      await save();
      return true;
    } catch (e) {
      reportError(e);
      return false;
    }
  }, [save]);

  const revert = useCallback(() => {
    if (saved.current === null) return;
    current.current = saved.current;
    setValueState(saved.current);
    markDirty(optsRef.current.id, false);
  }, []);

  return { value, setValue, dirty, loading, error, reload, saveNow, revert };
}
