// Small multiples of line charts for data the assistant produced (scans,
// series along z, previews): one compact SVG chart per series so quantities
// with different units never share an axis.
import { niceStep } from "../util";

type Chart = { title: string; x: number[]; series: { name: string; y: (number | null)[] }[]; xlabel?: string };

const W = 320;
const H = 120;
const PAD = { l: 44, r: 8, t: 18, b: 22 };

function fmt(v: number) {
  if (!Number.isFinite(v)) return "";
  const a = Math.abs(v);
  if (a !== 0 && (a < 1e-3 || a >= 1e5)) return v.toExponential(1);
  return String(Number(v.toPrecision(4)));
}

function One({ x, y, name, xlabel }: { x: number[]; y: (number | null)[]; name: string; xlabel?: string }) {
  const pts = x.map((xi, i) => [xi, y[i]] as [number, number | null]).filter(([xi, yi]) => Number.isFinite(xi) && yi != null && Number.isFinite(yi)) as [number, number][];
  if (pts.length < 1) return null;
  let x0 = Math.min(...pts.map((p) => p[0]));
  let x1 = Math.max(...pts.map((p) => p[0]));
  let y0 = Math.min(...pts.map((p) => p[1]));
  let y1 = Math.max(...pts.map((p) => p[1]));
  if (x1 === x0) {
    x0 -= 1;
    x1 += 1;
  }
  if (y1 === y0) {
    const d = Math.abs(y0) * 0.1 || 1;
    y0 -= d;
    y1 += d;
  }
  const pw = W - PAD.l - PAD.r;
  const ph = H - PAD.t - PAD.b;
  const X = (v: number) => PAD.l + ((v - x0) / (x1 - x0)) * pw;
  const Y = (v: number) => PAD.t + ph - ((v - y0) / (y1 - y0)) * ph;
  const ys = niceStep((y1 - y0) / 3);
  const xs = niceStep((x1 - x0) / 4);
  const yTicks: number[] = [];
  for (let v = Math.ceil(y0 / ys) * ys; v <= y1 + ys * 1e-9; v += ys) yTicks.push(v);
  const xTicks: number[] = [];
  for (let v = Math.ceil(x0 / xs) * xs; v <= x1 + xs * 1e-9; v += xs) xTicks.push(v);
  const path = pts.map(([a, b], i) => `${i ? "L" : "M"}${X(a).toFixed(1)},${Y(b).toFixed(1)}`).join(" ");
  return (
    <svg className="mini-chart" viewBox={`0 0 ${W} ${H}`}>
      <text x={PAD.l} y={12} className="mc-title">
        {name}
      </text>
      {yTicks.map((v) => (
        <g key={`y${v}`}>
          <line x1={PAD.l} x2={W - PAD.r} y1={Y(v)} y2={Y(v)} className="mc-grid" />
          <text x={PAD.l - 4} y={Y(v) + 3} textAnchor="end" className="mc-tick">
            {fmt(v)}
          </text>
        </g>
      ))}
      {xTicks.map((v) => (
        <text key={`x${v}`} x={X(v)} y={H - 8} textAnchor="middle" className="mc-tick">
          {fmt(v)}
        </text>
      ))}
      {xlabel && (
        <text x={W - PAD.r} y={H - 8} textAnchor="end" className="mc-tick mc-xlabel">
          {xlabel}
        </text>
      )}
      <path d={path} className="mc-line" />
      {pts.length <= 40 && pts.map(([a, b], i) => <circle key={i} cx={X(a)} cy={Y(b)} r={2.2} className="mc-dot" />)}
    </svg>
  );
}

export function MiniCharts({ chart }: { chart: Chart }) {
  return (
    <div className="mini-charts">
      {chart.series.map((s) => (
        <One key={s.name} x={chart.x} y={s.y} name={s.name} xlabel={chart.xlabel} />
      ))}
    </div>
  );
}
