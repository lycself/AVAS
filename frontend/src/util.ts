// Small helpers shared by many modules (no React, no back end).

/** Last path component; both separators, a trailing separator ignored. */
export function basename(p: string): string {
  return p.split(/[\\/]/).filter(Boolean).pop() ?? p;
}

/** A colour token ("--accent") as the browser resolved it, or *fallback* when unset. */
export function cssColor(name: string, fallback = ""): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** 1-2-5 rounded step not smaller than *raw* (axis ticks, grid lines). */
export function niceStep(raw: number): number {
  if (!(raw > 0) || !Number.isFinite(raw)) return 1;
  const exp = Math.floor(Math.log10(raw));
  const base = raw / 10 ** exp;
  for (const n of [1, 2, 5, 10]) if (base <= n) return n * 10 ** exp;
  return 10 ** (exp + 1);
}

/** Call *fn* once *ms* after the last call; `cancel()` drops a pending call. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): ((...args: A) => void) & { cancel: () => void } {
  let timer = 0;
  const wrapped = (...args: A) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), ms);
  };
  wrapped.cancel = () => window.clearTimeout(timer);
  return wrapped;
}
