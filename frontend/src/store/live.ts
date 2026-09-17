// Live beam data of the running (or last) simulation, fed by the back end's
// "run.live" events (avas/gui/services/live.py): the rows the engine has written
// to DataSet.txt so far, the lattice the run uses, the previous run's envelope and,
// for error studies, the finished seeds.  Pages open during a run get everything
// through "run.liveSnapshot".
import { create } from "zustand";
import { call, on } from "../bridge";

export type LiveArrays = { z: number[]; rmsX: number[]; rmsY: number[]; rmsZ: number[]; maxX: number[]; maxY: number[]; energy: number[]; alive: number[] };
export const LIVE_KEYS: (keyof LiveArrays)[] = ["z", "rmsX", "rmsY", "rmsZ", "maxX", "maxY", "energy", "alive"];

/** t: performance.now() when the loss arrived (0 for losses from a snapshot) */
export type LiveLoss = { z: number; n: number; t: number };

export type LiveEpisode = {
  id: string;
  key: string;
  zOffset: number;
  stage: string | null;
  stageLabel: string;
  index: number | null;
  total: number | null;
  particles0: number | null;
  rows: LiveArrays;
  losses: LiveLoss[];
  /** performance.now() of the last rows */
  updated: number;
};

export type LiveBandItem = { label: string; group: string | null; time: string | null; rows: LiveArrays };

export type LiveRunInfo = {
  id: string;
  kind: "project" | "segment" | "assistant";
  label: string;
  mode: string;
  started: string;
  running: boolean;
  outputDir: string | null;
  latticeName: string | null;
  latticeHash: string | null;
  hasPrevious: boolean;
  project: string | null;
};

export type LiveLattice = { name: string; text: string; fieldDirs: string[]; hash: string };

/** Envelope of the run before the current one (same shape as the last-run envelope). */
export type LivePrevious = Record<string, any> & { z: ArrayLike<number>; started?: string; latticeHash?: string | null };

type LiveState = {
  run: LiveRunInfo | null;
  lattice: LiveLattice | null;
  previous: LivePrevious | null;
  episode: LiveEpisode | null;
  band: LiveBandItem[];
  /** bumps on every change of the data (cheap dependency for drawing) */
  version: number;
};

export const useLive = create<LiveState>(() => ({ run: null, lattice: null, previous: null, episode: null, band: [], version: 0 }));

const set = useLive.setState;
const get = useLive.getState;

function emptyArrays(): LiveArrays {
  return { z: [], rmsX: [], rmsY: [], rmsZ: [], maxX: [], maxY: [], energy: [], alive: [] };
}

function toArrays(src: Record<string, ArrayLike<number | null> | undefined> | null | undefined): LiveArrays {
  const out = emptyArrays();
  if (!src) return out;
  for (const k of LIVE_KEYS) {
    const v = src[k];
    if (v) out[k] = Array.from(v, (x) => (x == null ? NaN : Number(x)));
  }
  return out;
}

function appendRows(target: LiveArrays, rows: Record<string, (number | null)[]>) {
  for (const k of LIVE_KEYS) {
    const v = rows[k];
    if (!v) continue;
    const arr = target[k];
    for (const x of v) arr.push(x == null ? NaN : x);
  }
}

let snapshotTimer = 0;
let snapshotSeq = 0;

/** Fetch everything for the current run (debounced). */
export function refreshLive(delay = 150) {
  window.clearTimeout(snapshotTimer);
  snapshotTimer = window.setTimeout(async () => {
    const my = ++snapshotSeq;
    try {
      const s = await call<any>("run.liveSnapshot");
      if (my !== snapshotSeq) return;
      if (!s) {
        set((st) => ({ run: null, lattice: null, previous: null, episode: null, band: [], version: st.version + 1 }));
        return;
      }
      const { lattice, previous, episode, band, ...run } = s;
      set((st) => ({
        run: run as LiveRunInfo,
        lattice: lattice ?? null,
        previous: previous ?? null,
        episode: episode
          ? {
              id: episode.id,
              key: episode.key,
              zOffset: episode.zOffset ?? 0,
              stage: episode.stage ?? null,
              stageLabel: episode.stageLabel ?? "",
              index: episode.index ?? null,
              total: episode.total ?? null,
              particles0: episode.particles0 ?? null,
              rows: toArrays(episode.rows),
              losses: (episode.losses ?? []).map((l: any) => ({ z: l.z, n: l.n, t: 0 })),
              updated: performance.now(),
            }
          : null,
        band: (band ?? []).map((b: any) => ({ label: b.label, group: b.group ?? null, time: b.time ?? null, rows: toArrays(b.rows) })),
        version: st.version + 1,
      }));
    } catch {
      /* the next event retries */
    }
  }, delay);
}

function handle(e: any) {
  const st = get();
  switch (e?.type) {
    case "begin":
      set({ run: e.run, lattice: null, previous: null, episode: null, band: [], version: st.version + 1 });
      refreshLive(0); // lattice text and the previous run's envelope
      return;
    case "episode":
      if (st.run?.id !== e.run) return refreshLive();
      set({
        episode: {
          id: e.episode.id,
          key: e.episode.key,
          zOffset: e.episode.zOffset ?? 0,
          stage: e.episode.stage ?? null,
          stageLabel: e.episode.stageLabel ?? "",
          index: e.episode.index ?? null,
          total: e.episode.total ?? null,
          particles0: e.episode.particles0 ?? null,
          rows: emptyArrays(),
          losses: [],
          updated: performance.now(),
        },
        version: st.version + 1,
      });
      if (st.run?.kind === "assistant") refreshLive(); // every evaluation has its own lattice
      return;
    case "rows": {
      const ep = st.episode;
      if (st.run?.id !== e.run || !ep || ep.id !== e.episode) return refreshLive();
      const now = performance.now();
      const rows = e.reset ? emptyArrays() : ep.rows;
      if (e.rows) appendRows(rows, e.rows);
      const losses = (e.reset ? [] : ep.losses).concat((e.losses ?? []).map((l: any) => ({ z: l.z, n: l.n, t: now })));
      set({ episode: { ...ep, rows, losses, particles0: e.particles0 ?? ep.particles0, updated: now }, version: st.version + 1 });
      return;
    }
    case "band":
      if (st.run?.id !== e.run) return refreshLive();
      set({ band: [...st.band, { label: e.item.label, group: e.item.group ?? null, time: e.item.time ?? null, rows: toArrays(e.item.rows) }], version: st.version + 1 });
      return;
    case "end": {
      const run = st.run;
      if (run && run.id === e.run) set({ run: { ...run, running: false }, version: st.version + 1 });
      return;
    }
  }
}

let started = false;
export function initLive() {
  if (started) return;
  started = true;
  on("run.live", handle);
  refreshLive(0);
}

/** Last value of *arr* that is a finite number. */
export function lastFinite(arr: ArrayLike<number>): number {
  for (let i = arr.length - 1; i >= 0; i--) if (Number.isFinite(arr[i])) return arr[i];
  return NaN;
}
