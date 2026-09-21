/** Legacy stamps lack a timezone: keep them verbatim rather than guessing UTC. */
export function formatBuildTime(value: string): string | null {
  if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const zone = `UTC${offset >= 0 ? "+" : "-"}${hours}${minutes ? `:${pad(minutes)}` : ""}`;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())} (${zone})`;
}
