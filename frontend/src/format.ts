import { t } from "./i18n";

/** "12 s", "3 min 05 s", "1 h 02 min"; en dash for unknown. */
export function fmtSeconds(s: number | null | undefined): string {
  if (s == null || !Number.isFinite(s)) return "–";
  const v = Math.round(s);
  if (v < 60) return `${v} s`;
  if (v < 3600) return `${Math.floor(v / 60)} min ${String(v % 60).padStart(2, "0")} s`;
  return `${Math.floor(v / 3600)} h ${String(Math.floor((v % 3600) / 60)).padStart(2, "0")} min`;
}

export function humanSize(n: number): string {
  if (n < 1024) return `${n.toFixed(0)} B`;
  const units = ["KB", "MB", "GB"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

/** Python's "%.6g"-like formatting. */
export function fmtG(v: number | null | undefined, digits = 6): string {
  if (v == null || !Number.isFinite(v)) return "–";
  if (v === 0) return "0";
  const abs = Math.abs(v);
  const exp = Math.floor(Math.log10(abs));
  if (exp < -4 || exp >= digits) {
    const s = v.toExponential(digits - 1);
    const [m, e] = s.split("e");
    const mant = m.includes(".") ? m.replace(/0+$/, "").replace(/\.$/, "") : m;
    const en = Number(e);
    return `${mant}e${en < 0 ? "-" : "+"}${String(Math.abs(en)).padStart(2, "0")}`;
  }
  const s = v.toFixed(Math.max(0, digits - 1 - exp));
  return s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
}

export function runStatusLabel(status?: string): string {
  switch (status) {
    case "finished":
      return t("finished");
    case "failed":
      return t("failed");
    case "running":
      return t("running");
    case "stopped":
      return t("stopped");
    default:
      return status ?? "?";
  }
}
