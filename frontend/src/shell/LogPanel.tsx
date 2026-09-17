// Bottom panel with the Python log (logger "avas.*" at INFO and above).
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { create } from "zustand";
import { call, on } from "../bridge";
import { Icon, IconButton, cx } from "../components/ui";
import { openMenu } from "../components/overlays";
import { useT } from "../i18n";
import { setLogMaximized, setLogVisible, showStatus, useApp } from "../store/app";

export type LogEntry = { t: number; level: string; name: string; msg: string };
const MAX = 5000;

export type LogFilter = "all" | "problems" | "gui";
type LogState = { entries: LogEntry[]; errors: number; warnings: number; seq: number; filter: LogFilter; query: string };
export const useLog = create<LogState>(() => ({ entries: [], errors: 0, warnings: 0, seq: 0, filter: "all", query: "" }));

/** Open the log panel, optionally with a filter (e.g. "problems" from a "Show log" link). */
export function showLog(filter?: LogFilter, query?: string) {
  setLogVisible(true);
  const patch: Partial<LogState> = {};
  if (filter) patch.filter = filter;
  if (query !== undefined) patch.query = query;
  useLog.setState(patch);
}

function add(batch: LogEntry[]) {
  useLog.setState((s) => {
    let errors = s.errors;
    let warnings = s.warnings;
    for (const e of batch) {
      if (e.level === "ERROR" || e.level === "CRITICAL") errors++;
      else if (e.level === "WARNING") warnings++;
    }
    const entries = s.entries.concat(batch);
    return { entries: entries.length > MAX ? entries.slice(entries.length - MAX) : entries, errors, warnings, seq: s.seq + batch.length };
  });
  const last = batch[batch.length - 1];
  if (last && last.name !== "avas.engine") {
    const line = last.msg.split("\n").find((l) => l.trim()) ?? "";
    const level = last.level === "ERROR" || last.level === "CRITICAL" ? "error" : last.level === "WARNING" ? "warning" : "info";
    if (!useApp.getState().run.running) showStatus(line, level);
  }
}

let pendingBatch: LogEntry[] = [];
let flushQueued = false;
export function initLog() {
  call<LogEntry[]>("app.logHistory").then((h) => h.length && add(h)).catch(() => undefined);
  on("log", (entry: LogEntry) => {
    pendingBatch.push(entry);
    if (!flushQueued) {
      flushQueued = true;
      requestAnimationFrame(() => {
        flushQueued = false;
        const b = pendingBatch;
        pendingBatch = [];
        add(b);
      });
    }
  });
}

export function clearLog() {
  useLog.setState({ entries: [], errors: 0, warnings: 0, seq: 0 });
  showStatus("");
  call("app.clearLog").catch(() => undefined);
}

function stamp(t: number) {
  const d = new Date(t * 1000);
  return d.toTimeString().slice(0, 8);
}

export function LogPanel() {
  const t = useT();
  const entries = useLog((s) => s.entries);
  const maximized = useApp((s) => s.logMaximized);
  const filter = useLog((s) => s.filter);
  const query = useLog((s) => s.query);
  const setFilter = (f: LogFilter) => useLog.setState({ filter: f });
  const setQuery = (q: string) => useLog.setState({ query: q });
  const bodyRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter === "problems" && !(e.level === "WARNING" || e.level === "ERROR" || e.level === "CRITICAL")) return false;
      if (filter === "gui" && e.name === "avas.engine") return false;
      if (q && !e.msg.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [entries, filter, query]);

  // render only the tail for speed; scrolling up shows more
  const [limit, setLimit] = useState(600);
  const visible = shown.length > limit ? shown.slice(shown.length - limit) : shown;

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [visible]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const onScroll = () => {
      stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
      if (el.scrollTop < 40 && limit < shown.length) setLimit((l) => l + 600);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [limit, shown.length]);

  const copyAll = () => {
    const text = shown.map((e) => `${stamp(e.t)} ${e.level.padEnd(7)} ${e.msg}`).join("\n");
    navigator.clipboard?.writeText(text).catch(() => undefined);
  };

  return (
    <div className="log-panel">
      <div className="panel-header">
        <div className="panel-tab active">{t("Log").toUpperCase()}</div>
        <div className="panel-filters">
          {(["all", "problems", "gui"] as LogFilter[]).map((f) => (
            <button key={f} className={cx("chip", filter === f && "active")} onClick={() => setFilter(f)}>
              {f === "all" ? t("All") : f === "problems" ? t("Problems") : t("Without engine output")}
            </button>
          ))}
          <div className="panel-search">
            <Icon name="filter" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Filter")} spellCheck={false} />
          </div>
        </div>
        <div className="grow" />
        <IconButton icon="copy" tip={t("Copy log")} onClick={copyAll} />
        <IconButton icon="clear-all" tip={t("Clear log")} onClick={clearLog} />
        <IconButton
          icon={maximized ? "chevron-down" : "chevron-up"}
          tip={maximized ? t("Restore panel size") : t("Maximize panel")}
          onClick={() => setLogMaximized(!maximized)}
        />
        <IconButton icon="close" tip={t("Hide panel (Ctrl+J)")} onClick={() => setLogVisible(false)} />
      </div>
      <div
        className="log-body selectable mono"
        ref={bodyRef}
        onContextMenu={(e) => {
          e.preventDefault();
          const sel = window.getSelection()?.toString() ?? "";
          openMenu(
            [
              { label: t("Copy"), icon: "copy", disabled: !sel, onClick: () => navigator.clipboard?.writeText(sel) },
              { label: t("Copy log"), onClick: copyAll },
              { type: "separator" },
              { label: t("Clear log"), icon: "clear-all", onClick: clearLog },
            ],
            e.clientX,
            e.clientY,
          );
        }}
      >
        {visible.map((e, i) => (
          <div key={shown.length - visible.length + i} className={cx("log-line", `log-${e.level.toLowerCase()}`, e.name === "avas.engine" && "log-engine")}>
            <span className="log-time">{stamp(e.t)}</span>
            <span className="log-msg">{e.msg}</span>
          </div>
        ))}
        {!shown.length && <div className="log-empty">{entries.length ? t("No matching lines") : t("No messages yet")}</div>}
      </div>
    </div>
  );
}
