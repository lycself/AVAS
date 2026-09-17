// Envelope data for the visual editor: the last run (DataSet.txt) and the
// linear preview of the text being edited.  Preview requests are serialised:
// one call in flight, the newest waiting one replaces older ones, so dragging a
// slider never queues up stale calculations.
import { useCallback, useEffect, useRef, useState } from "react";
import { call } from "../bridge";
import { useApp } from "../store/app";

type Arr = Float32Array | number[];

export type RunEnvelope = {
  z: Arr;
  rmsX: Arr;
  rmsY: Arr;
  maxX: Arr;
  maxY: Arr;
  cx: Arr;
  cy: Arr;
  energy: Arr;
  alive: Arr;
  losses: { z: number; n: number }[];
  particles: number;
  rows: number;
  started?: string;
  status?: string;
  lattice?: string | null;
};

export type PreviewElement = { line: number; z0: number; z1: number; w_in?: number; w_out?: number; phase_rf?: number | null; phase_s?: number | null };

export type Preview = {
  z: Arr;
  rms_x: Arr;
  rms_y: Arr;
  energy: Arr;
  elements: PreviewElement[];
  warnings: [string, string][];
  model: { space_charge?: boolean; elapsed_ms?: number; slices?: number };
};

export function useRunEnvelope(enabled: boolean) {
  const projectPath = useApp((s) => (s.project.open ? s.project.path : null));
  const lastFinished = useApp((s) => s.lastFinished);
  const [data, setData] = useState<RunEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled || !projectPath) {
      setData(null);
      return;
    }
    let alive = true;
    call<RunEnvelope | null>("lattice.runEnvelope")
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(null);
      })
      .catch((e) => alive && setError(e?.message ?? String(e)));
    return () => {
      alive = false;
    };
  }, [enabled, projectPath, lastFinished]);
  return { data, error };
}

export function useLinearPreview(opts: { enabled: boolean; fieldDirs: string[] | null; spaceCharge: boolean | null }) {
  const [data, setData] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const waiting = useRef<string | null>(null);
  const last = useRef<string | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const pump = useCallback(() => {
    if (inFlight.current || waiting.current === null) return;
    const text = waiting.current;
    waiting.current = null;
    inFlight.current = true;
    setBusy(true);
    const { fieldDirs, spaceCharge } = optsRef.current;
    call<Preview>("lattice.preview", { text, fieldDirs, spaceCharge })
      .then((d) => {
        if (!alive.current) return;
        setData(d);
        setError(null);
      })
      .catch((e) => alive.current && setError(e?.message ?? String(e)))
      .finally(() => {
        inFlight.current = false;
        if (!alive.current) return;
        if (waiting.current !== null) pump();
        else setBusy(false);
      });
  }, []);

  /** Ask for a preview of *text* (dropped if identical to the last one asked for). */
  const request = useCallback(
    (text: string, force = false) => {
      if (!optsRef.current.enabled) return;
      if (!force && text === last.current) return;
      last.current = text;
      waiting.current = text;
      pump();
    },
    [pump],
  );

  useEffect(() => {
    if (!opts.enabled) {
      setData(null);
      setError(null);
      last.current = null;
    }
  }, [opts.enabled]);

  // options changed: recompute the last text
  const key = JSON.stringify([opts.fieldDirs, opts.spaceCharge]);
  useEffect(() => {
    if (opts.enabled && last.current !== null) request(last.current, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, error, busy, request };
}

/** Text with one line replaced (for drafts while dragging). */
export function replaceLine(text: string, line: number, newLine: string): string {
  const lines = text.split(/\r?\n/);
  if (line >= 0 && line < lines.length) lines[line] = newLine;
  return lines.join("\n");
}

/** Linear interpolation of a series at z (NaN outside). */
export function sampleAt(z: Arr, v: Arr, zq: number): number {
  const n = z.length;
  if (!n || zq < z[0] || zq > z[n - 1]) return NaN;
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (z[mid] <= zq) lo = mid;
    else hi = mid;
  }
  const dz = z[hi] - z[lo];
  if (dz <= 0) return v[lo];
  return v[lo] + ((v[hi] - v[lo]) * (zq - z[lo])) / dz;
}
