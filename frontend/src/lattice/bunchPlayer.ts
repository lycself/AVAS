// Where the schematic bunch is: one "player" shared by the Run page panel, the 2D
// layout and the 3D view.
//
// * live: follows the running simulation.  The engine writes DataSet rows every
//   fraction of a second and progress lines every ~3 s, so the bunch moves on at
//   the recent speed between updates, never ahead of the last row written, and
//   catches up smoothly when it lags.
// * replay: walks a finished envelope, at uniform speed in z or in proportion to
//   the beam's time of flight (slow where β is small).
//
// Views subscribe with subscribeBunch(); frames come at most 30 per second and only
// while something moves (motion setting "off": only when data arrive).  Nothing
// here is a particle distribution: sizes come from the rms envelope.
import { useEffect, useState } from "react";
import { create } from "zustand";
import { useApp } from "../store/app";
import { lastFinite, useLive } from "../store/live";
import { sampleAt } from "./usePreview";

export type MotionMode = "full" | "lite" | "off";
export type MotionSetting = "auto" | MotionMode;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/** Default (no setting): full.  "auto" follows Windows' "Animation effects" setting. */
export function resolveMotion(setting: unknown): MotionMode {
  if (setting === "full" || setting === "lite" || setting === "off") return setting;
  if (setting === "auto") return reducedMotion.matches ? "off" : "full";
  return "full";
}

export function currentMotion(): MotionMode {
  return resolveMotion(useApp.getState().settings["ui/motion"]);
}

export function useMotion(): MotionMode {
  const setting = useApp((s) => s.settings["ui/motion"]);
  const [, bump] = useState(0);
  useEffect(() => {
    const onChange = () => bump((n) => n + 1);
    reducedMotion.addEventListener("change", onChange);
    return () => reducedMotion.removeEventListener("change", onChange);
  }, []);
  return resolveMotion(setting);
}

export type Track = {
  z: ArrayLike<number>;
  rmsX: ArrayLike<number>;
  rmsY: ArrayLike<number>;
  rmsZ?: ArrayLike<number>;
  energy: ArrayLike<number>;
  alive: ArrayLike<number>;
  losses: { z: number; n: number }[];
  particles0: number;
};

export type BunchFrame = {
  source: "live" | "replay";
  /** live: kind of the run (the visual editor ignores assistant studies) */
  kind: "project" | "segment" | "assistant" | "scan";
  z: number;
  rmsX: number;
  rmsY: number;
  rmsZ: number;
  energy: number;
  alive: number;
  particles0: number;
  /** losses the bunch passed during the last FLASH_MS */
  flashes: { z: number; n: number; age: number }[];
  /** live: the engine is still running (or paused) */
  running: boolean;
  progress: number;
  zStart: number;
  zEnd: number;
};

export type ReplayTimeMode = "z" | "beta";
export const REPLAY_SPEEDS = [0.25, 0.5, 1, 2, 4, 8];
const REPLAY_SECONDS = 10; // the whole track at 1x
const FLASH_MS = 1500;
const FRAME_MS = 33;
const C_LIGHT = 299792458;

type Replay = {
  id: string;
  label: string;
  track: Track;
  kind: BunchFrame["kind"];
  playing: boolean;
  progress: number;
  speed: number;
  timeMode: ReplayTimeMode;
  /** cumulative time of flight normalised to 0..1 per track point, or null without the rest mass */
  tau: Float64Array | null;
};

type PlayerState = { replay: Replay | null };

export const usePlayer = create<PlayerState>(() => ({ replay: null }));

function flightTimes(track: Track, restMass: number | null | undefined): Float64Array | null {
  const n = track.z.length;
  if (!restMass || !(restMass > 0) || n < 2) return null;
  const tau = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    const w = (track.energy[i] + track.energy[i - 1]) / 2;
    const g = 1 + w / restMass;
    const beta = g > 1 ? Math.sqrt(1 - 1 / (g * g)) : NaN;
    const dz = track.z[i] - track.z[i - 1];
    tau[i] = tau[i - 1] + (Number.isFinite(beta) && beta > 0 && dz > 0 ? dz / (beta * C_LIGHT) : 0);
  }
  const total = tau[n - 1];
  if (!(total > 0)) return null;
  for (let i = 0; i < n; i++) tau[i] /= total;
  return tau;
}

/** Start replaying *track* (restMass in MeV enables the time-of-flight speed). */
export function startReplay(id: string, label: string, track: Track, opts: { restMass?: number | null; kind?: BunchFrame["kind"] } = {}) {
  const prev = usePlayer.getState().replay;
  const tau = flightTimes(track, opts.restMass);
  usePlayer.setState({
    replay: {
      id,
      label,
      track,
      kind: opts.kind ?? "project",
      playing: true,
      progress: prev?.id === id && prev.progress < 1 ? prev.progress : 0,
      speed: prev?.speed ?? 1,
      timeMode: prev?.timeMode === "beta" && tau ? "beta" : "z",
      tau,
    },
  });
  resetFlashes();
  kick();
}

export function stopReplay() {
  usePlayer.setState({ replay: null });
  resetFlashes();
  kick();
}

export function setReplay(patch: Partial<Pick<Replay, "playing" | "progress" | "speed" | "timeMode">>) {
  const r = usePlayer.getState().replay;
  if (!r) return;
  const next = { ...r, ...patch };
  if (patch.timeMode === "beta" && !r.tau) next.timeMode = "z";
  if (patch.playing && r.progress >= 1 && patch.progress === undefined) next.progress = 0;
  if (patch.progress !== undefined) {
    next.progress = Math.max(0, Math.min(1, patch.progress));
    resetFlashes();
  }
  usePlayer.setState({ replay: next });
  kick();
}

function trackZ(r: Replay): number {
  const z = r.track.z;
  const n = z.length;
  if (!n) return NaN;
  const p = r.progress;
  if (r.timeMode === "beta" && r.tau) {
    const tau = r.tau;
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (tau[mid] <= p) lo = mid;
      else hi = mid;
    }
    const d = tau[hi] - tau[lo];
    return d > 0 ? z[lo] + ((z[hi] - z[lo]) * (p - tau[lo])) / d : z[lo];
  }
  return z[0] + p * (z[n - 1] - z[0]);
}

/* ------------------------------------------------------------------ live motion */
const live = { episode: "", z: NaN, hist: [] as [number, number][] };

function knownLiveZ(): number {
  const ep = useLive.getState().episode;
  if (!ep) return NaN;
  let z = lastFinite(ep.rows.z);
  const run = useApp.getState().run;
  // the progress line's position is in the stage's own coordinates
  if (run.running && run.pos_m != null && Number.isFinite(run.pos_m)) z = Number.isFinite(z) ? Math.max(z, run.pos_m + ep.zOffset) : run.pos_m + ep.zOffset;
  return z;
}

function advanceLive(dt: number, now: number, motion: MotionMode): boolean {
  const ep = useLive.getState().episode;
  if (!ep) return false;
  const known = knownLiveZ();
  if (ep.id !== live.episode) {
    live.episode = ep.id;
    live.hist = [];
    live.z = ep.rows.z.length ? ep.rows.z[0] : ep.zOffset;
    resetFlashes();
  }
  if (!Number.isFinite(known)) return false;
  const h = live.hist;
  if (!h.length || known > h[h.length - 1][1] + 1e-12) h.push([now, known]);
  while (h.length > 2 && now - h[0][0] > 20000) h.shift();
  const v = h.length >= 2 && h[h.length - 1][0] > h[0][0] ? (h[h.length - 1][1] - h[0][1]) / ((h[h.length - 1][0] - h[0][0]) / 1000) : 0;
  if (!Number.isFinite(live.z) || motion === "off") {
    live.z = known;
    return false;
  }
  if (!useApp.getState().run.paused) live.z += v * dt;
  const lag = known - live.z;
  if (lag <= 0) live.z = known;
  else if (lag > Math.max(v * 2.5, 1e-9)) live.z += lag * (1 - Math.exp(-dt / 0.7));
  return known - live.z > 1e-6;
}

/* ------------------------------------------------------------------ losses the bunch passes */
const flash = { key: "", next: 0, passed: [] as { z: number; n: number; at: number }[] };

function resetFlashes() {
  flash.key = "";
}

function collectFlashes(key: string, losses: { z: number; n: number }[], z: number, now: number) {
  if (flash.key !== key) {
    flash.key = key;
    flash.passed = [];
    flash.next = 0;
    while (flash.next < losses.length && losses[flash.next].z <= z) flash.next++; // already behind: no flash
  }
  while (flash.next < losses.length && losses[flash.next].z <= z) {
    flash.passed.push({ ...losses[flash.next], at: now });
    flash.next++;
  }
  flash.passed = flash.passed.filter((f) => now - f.at < FLASH_MS);
  return flash.passed.map((f) => ({ z: f.z, n: f.n, age: now - f.at }));
}

/* ------------------------------------------------------------------ frames */
function frameAt(now: number): BunchFrame | null {
  const r = usePlayer.getState().replay;
  if (r) {
    const t = r.track;
    const z = trackZ(r);
    const n = t.z.length;
    return {
      source: "replay",
      kind: r.kind,
      z,
      rmsX: sampleAt(t.z, t.rmsX, z),
      rmsY: sampleAt(t.z, t.rmsY, z),
      rmsZ: t.rmsZ ? sampleAt(t.z, t.rmsZ, z) : NaN,
      energy: sampleAt(t.z, t.energy, z),
      alive: sampleAt(t.z, t.alive, z),
      particles0: t.particles0,
      flashes: collectFlashes(`replay:${r.id}`, t.losses, z, now),
      running: false,
      progress: r.progress,
      zStart: n ? t.z[0] : 0,
      zEnd: n ? t.z[n - 1] : 0,
    };
  }
  const { episode: ep, run } = useLive.getState();
  if (!ep || !run || !ep.rows.z.length) return null;
  const rows = ep.rows;
  const z = Number.isFinite(live.z) ? live.z : lastFinite(rows.z);
  const zStart = rows.z[0];
  const zEnd = lastFinite(rows.z);
  return {
    source: "live",
    kind: run.kind,
    z,
    rmsX: sampleAt(rows.z, rows.rmsX, Math.min(z, zEnd)),
    rmsY: sampleAt(rows.z, rows.rmsY, Math.min(z, zEnd)),
    rmsZ: sampleAt(rows.z, rows.rmsZ, Math.min(z, zEnd)),
    energy: sampleAt(rows.z, rows.energy, Math.min(z, zEnd)),
    alive: sampleAt(rows.z, rows.alive, Math.min(z, zEnd)),
    particles0: ep.particles0 ?? rows.alive[0],
    flashes: collectFlashes(`live:${ep.id}`, ep.losses, z, now),
    running: run.running,
    progress: zEnd > zStart ? (z - zStart) / (zEnd - zStart) : 0,
    zStart,
    zEnd,
  };
}

type Sub = { fn: (frame: BunchFrame | null) => void; visible: () => boolean };
const subs = new Set<Sub>();
let raf = 0;
let lastFrame = 0;
let lastAdvance = 0;

function tick(now: number) {
  raf = 0;
  if (!subs.size) return;
  if (now - lastFrame < FRAME_MS) {
    raf = requestAnimationFrame(tick);
    return;
  }
  const dt = lastAdvance ? Math.min(0.25, (now - lastAdvance) / 1000) : 0;
  lastAdvance = now;
  lastFrame = now;
  const motion = currentMotion();
  let moving = false;
  const r = usePlayer.getState().replay;
  if (r?.playing) {
    const progress = r.progress + (dt * r.speed) / REPLAY_SECONDS;
    usePlayer.setState({ replay: { ...r, progress: Math.min(1, progress), playing: progress < 1 } });
    moving = progress < 1;
  }
  const lagging = advanceLive(dt, now, motion);
  const run = useLive.getState().run;
  if (!r && run?.running && motion !== "off" && !useApp.getState().run.paused) moving = true;
  if (lagging && motion !== "off") moving = true;
  const frame = frameAt(now);
  if (frame?.flashes.length && motion !== "off") moving = true;
  for (const s of subs) if (s.visible()) s.fn(frame);
  if (moving) raf = requestAnimationFrame(tick);
  else lastAdvance = 0;
}

/** Draw one frame soon (data or settings changed). */
export function kick() {
  if (!raf && subs.size) raf = requestAnimationFrame(tick);
}

/** Receive bunch frames while *visible()* is true; returns the unsubscribe function. */
export function subscribeBunch(fn: (frame: BunchFrame | null) => void, visible: () => boolean = () => true): () => void {
  const sub = { fn, visible };
  subs.add(sub);
  kick();
  return () => {
    subs.delete(sub);
  };
}

useLive.subscribe(kick);
useApp.subscribe((s, prev) => {
  if (s.run !== prev.run || s.settings !== prev.settings || s.page !== prev.page) kick();
});
reducedMotion.addEventListener("change", kick);
document.addEventListener("visibilitychange", kick);

/** The current frame, re-rendered at most *fps* times per second (for text and numbers). */
export function useBunchFrame(fps = 4): BunchFrame | null {
  const [frame, setFrame] = useState<BunchFrame | null>(null);
  useEffect(() => {
    let last = 0;
    let pending: number | undefined;
    const unsub = subscribeBunch((f) => {
      const now = performance.now();
      window.clearTimeout(pending);
      if (now - last >= 1000 / fps) {
        last = now;
        setFrame(f);
      } else pending = window.setTimeout(() => setFrame(f), 1000 / fps);
    });
    return () => {
      window.clearTimeout(pending);
      unsub();
    };
  }, [fps]);
  return frame;
}
