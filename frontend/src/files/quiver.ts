// Arrows for a field slice: one Plotly line trace drawing a thinned grid of
// vectors over the heat map.  Kept out of the view so it can be tested.

export type Grid = {
  /** Horizontal and vertical grid coordinates of the slice (data units). */
  u: ArrayLike<number>;
  v: ArrayLike<number>;
  /** In-plane field components, row-major over (v, u) as the back end sends them. */
  fu: ArrayLike<number>;
  fv: ArrayLike<number>;
};

export type QuiverOptions = {
  /** Wanted number of arrows along each axis. */
  nu?: number;
  nv?: number;
  /** Longest arrow as a fraction of the spacing between arrows. */
  fill?: number;
};

/** A polyline with NaN gaps, plus the longest sampled vector in field units. */
export type Quiver = { x: number[]; y: number[]; max: number; count: number };

const HEAD = 0.3; // head length as a fraction of the shaft
const HEAD_ANGLE = 0.42; // rad, half the opening of the head

/**
 * Arrows sampled from *grid*, as a single polyline.
 *
 * A shaft is a multiple of the field vector in data units, so on screen it
 * takes the slope of a field line of the heat map whatever ranges the two axes
 * carry (metres of z against millimetres of x).  It is the *true* direction of
 * the field only when the plot has equal scales; otherwise it is stretched
 * along with the picture.  Length and head are built in coordinates normalised
 * by each axis's extent, so the longest arrow fills the sampling spacing and
 * the heads stay square however the plot is stretched.
 */
export function quiver(grid: Grid, opts: QuiverOptions = {}): Quiver {
  const { u, v, fu, fv } = grid;
  const nu = Math.max(2, Math.floor(opts.nu ?? 26));
  const nv = Math.max(2, Math.floor(opts.nv ?? 13));
  const fill = opts.fill ?? 0.9;
  const du = Number(u[u.length - 1]) - Number(u[0]);
  const dv = Number(v[v.length - 1]) - Number(v[0]);
  const empty: Quiver = { x: [], y: [], max: 0, count: 0 };
  if (!u.length || !v.length || !du || !dv) return empty;

  const iu = sample(u.length, nu);
  const iv = sample(v.length, nv);
  // sample first: the scale must come from the arrows actually drawn
  const pts: { su: number; sv: number; nx: number; ny: number }[] = [];
  let longest = 0; // in normalised units
  let max = 0; // in field units, for the caption
  for (const j of iv) {
    for (const i of iu) {
      const k = j * u.length + i;
      const a = Number(fu[k]);
      const b = Number(fv[k]);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      const nx = a / du;
      const ny = b / dv;
      const n = Math.hypot(nx, ny);
      if (n > longest) longest = n;
      max = Math.max(max, Math.hypot(a, b));
      pts.push({ su: (Number(u[i]) - Number(u[0])) / du, sv: (Number(v[j]) - Number(v[0])) / dv, nx, ny });
    }
  }
  if (!longest) return empty;

  const scale = (fill * Math.min(1 / iu.length, 1 / iv.length)) / longest;
  const x: number[] = [];
  const y: number[] = [];
  let count = 0;
  const push = (px: number, py: number) => {
    x.push(Number.isNaN(px) ? NaN : Number(u[0]) + px * du);
    y.push(Number.isNaN(py) ? NaN : Number(v[0]) + py * dv);
  };
  for (const p of pts) {
    const dx = p.nx * scale;
    const dy = p.ny * scale;
    const len = Math.hypot(dx, dy);
    if (len < 1e-4 * fill * Math.min(1 / iu.length, 1 / iv.length)) continue; // a dot, not an arrow
    const tipX = p.su + dx;
    const tipY = p.sv + dy;
    const a = Math.atan2(dy, dx);
    const h = HEAD * len;
    // tail, tip, one wing, back to the tip, the other wing: the retraced
    // segment costs nothing and saves a NaN gap inside the arrow
    push(p.su, p.sv);
    push(tipX, tipY);
    push(tipX - h * Math.cos(a - HEAD_ANGLE), tipY - h * Math.sin(a - HEAD_ANGLE));
    push(tipX, tipY);
    push(tipX - h * Math.cos(a + HEAD_ANGLE), tipY - h * Math.sin(a + HEAD_ANGLE));
    push(NaN, NaN);
    count++;
  }
  return { x, y, max, count };
}

/** At most *k* indices of ``range(n)``, spread evenly and kept away from the edges. */
function sample(n: number, k: number): number[] {
  if (n <= 0) return [];
  const m = Math.min(n, k);
  const out = new Set<number>();
  for (let i = 0; i < m; i++) out.add(Math.min(n - 1, Math.round(((i + 0.5) * n) / m - 0.5)));
  return [...out];
}
