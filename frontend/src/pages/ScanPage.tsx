// Scan page: run one parameter over several values on copies of the inputs
// (avas/gui/services/scan.py) and tabulate / plot the results.
import { useCallback, useEffect, useMemo, useState } from "react";
import { call, on } from "../bridge";
import { openPath } from "../host";
import { Plot } from "../components/Plot";
import { confirmDialog, reportError, toast } from "../components/overlays";
import { Badge, Button, Checkbox, CommitInput, Empty, Field, IconButton, Radio, Section, Select, Spinner, cx } from "../components/ui";
import { fmtG, fmtSeconds, runStatusLabel } from "../format";
import { pick, useT } from "../i18n";
import { setPage, showResults, useApp } from "../store/app";
import { NoProject, PageHeader } from "./common";

type Spec = { kind: "lattice" | "beam" | "input"; target?: string; param?: string; keyword?: string; position?: number };
type Target = { kind: string; file: string; param: string; label: string; unit: string; original: string | null; line?: number; element?: string; keyword?: string };
type Row = { index: number; value: number; seconds?: number; output_dir?: string; error?: string; [metric: string]: unknown };
type Result = { label: string; created: string; finished?: string; status: string; folder: string; target: Target; values: number[]; metrics: string[]; rows: Row[] };
type ScanState = { running: boolean; result: Result | null };
type ScanListItem = { folder: string; label: string; created: string; finished?: string; status: string; target: Target; count: number; done: number };
type Statement = { line: number; keyword: string; key: string; name: string; params: string[]; isElement: boolean; known: boolean; active: boolean; zStart: number | null };
type KeywordSpec = { key: string; title: [string, string]; params: { key: string; label: [string, string]; unit: string; kind: string }[] };

const METRIC_LABEL: Record<string, string> = {
  transmission: "transmission",
  lost: "lost macro-particles",
  energy_in: "energy in (MeV)",
  energy_out: "energy out (MeV)",
  emit_x_in: "εx in",
  emit_y_in: "εy in",
  emit_z_in: "εz in",
  emit_x_out: "εx out",
  emit_y_out: "εy out",
  emit_z_out: "εz out",
  emit_x_growth: "εx growth",
  emit_y_growth: "εy growth",
  emit_z_growth: "εz growth",
  rms_x_max: "max rms x (mm)",
  rms_y_max: "max rms y (mm)",
  rms_x_out: "rms x out (mm)",
  rms_y_out: "rms y out (mm)",
  max_x_max: "max |x| (mm)",
  max_y_max: "max |y| (mm)",
  centroid_x_max: "max centroid x (mm)",
  centroid_y_max: "max centroid y (mm)",
  z_out: "z out (m)",
};

export default function ScanPage() {
  const t = useT();
  const project = useApp((s) => s.project);
  const run = useApp((s) => s.run);
  const [kind, setKind] = useState<Spec["kind"]>("lattice");
  const [target, setTarget] = useState("");
  const [param, setParam] = useState("");
  const [keyword, setKeyword] = useState("");
  const [position, setPosition] = useState(1);
  const [values, setValues] = useState("");
  const [label, setLabel] = useState("");
  const [metricsAll, setMetricsAll] = useState<{ default: string[]; all: string[] }>({ default: [], all: [] });
  const [metrics, setMetrics] = useState<string[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [schema, setSchema] = useState<{ lattice: KeywordSpec[]; beam: KeywordSpec[]; input: KeywordSpec[] } | null>(null);
  const [check, setCheck] = useState<{ target: Target; count: number; estimate_s: number | null } | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [state, setState] = useState<ScanState>({ running: false, result: null });
  const [scans, setScans] = useState<ScanListItem[]>([]);
  const [shown, setShown] = useState<Result | null>(null);

  // ---- lattice elements and keyword schema (for the pickers)
  useEffect(() => {
    if (!project.open) return;
    let alive = true;
    (async () => {
      try {
        const [m, s] = await Promise.all([call<{ default: string[]; all: string[] }>("scan.metrics"), call<any>("schema.all")]);
        if (!alive) return;
        setMetricsAll(m);
        setMetrics((cur) => (cur.length ? cur : m.default));
        setSchema({ lattice: s.lattice, beam: s.beam, input: s.input });
      } catch (e) {
        reportError(e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [project.open, project.path]);

  const loadElements = useCallback(async () => {
    try {
      const list = await call<{ active: string; fieldDirs: string[] }>("lattice.list");
      const file = await call<{ text: string }>("lattice.read", { name: list.active });
      const doc = await call<{ statements: Statement[] }>("lattice.parse", { text: file.text, fieldDirs: list.fieldDirs });
      setStatements(doc.statements.filter((s) => s.isElement && s.known));
    } catch {
      setStatements([]);
    }
  }, []);
  useEffect(() => {
    if (project.open) loadElements();
  }, [project.open, project.path, loadElements]);

  const loadScans = useCallback(async () => {
    try {
      setScans(await call<ScanListItem[]>("scan.list"));
    } catch {
      setScans([]);
    }
  }, []);
  const refreshState = useCallback(async () => {
    try {
      const s = await call<ScanState>("scan.state");
      setState(s);
      if (s.result) setShown(s.result);
    } catch {
      /* the next call reports it */
    }
  }, []);
  useEffect(() => {
    if (!project.open) return;
    loadScans();
    refreshState();
    const offs = [
      on("scan.progress", (r: Result) => {
        setState({ running: true, result: r });
        setShown(r);
      }),
      on("scan.finished", (info: { error?: string | null; status?: string }) => {
        refreshState();
        loadScans();
        if (info.error) toast(info.error, "error", 6000);
        else toast(info.status === "stopped" ? t("Scan stopped") : t("Scan finished"), info.status === "stopped" ? "info" : "success");
      }),
      on("bridge.reconnected", refreshState),
    ];
    return () => offs.forEach((f) => f());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.open, project.path]);

  const spec: Spec = useMemo(
    () => (kind === "lattice" ? { kind, target, param } : { kind, keyword, position }),
    [kind, target, param, keyword, position],
  );
  const complete = kind === "lattice" ? !!target && !!param : !!keyword;

  // ---- live check of the target and values
  useEffect(() => {
    if (!project.open || !complete) {
      setCheck(null);
      setCheckError(null);
      return;
    }
    const h = setTimeout(async () => {
      try {
        setCheck(await call("scan.check", { spec, values: values.trim() || undefined }));
        setCheckError(null);
      } catch (e: any) {
        setCheck(null);
        setCheckError(e?.message ?? String(e));
      }
    }, 250);
    return () => clearTimeout(h);
  }, [project.open, complete, spec, values]);

  if (!project.open) return <NoProject />;

  const elementOptions = statements.map((s) => ({
    value: String(s.line + 1),
    label: `${s.name || s.keyword}  ·  ${t("line {n}", { n: s.line + 1 })}  ·  ${s.keyword}${s.zStart != null ? `  ·  z ${fmtG(s.zStart, 4)} m` : ""}`,
  }));
  const chosen = statements.find((s) => String(s.line + 1) === target);
  const paramOptions = (chosen && schema?.lattice.find((k) => k.key === chosen.key)?.params.filter((p) => p.kind !== "reserved").map((p) => ({ value: p.key, label: `${p.key}  ·  ${pick(p.label)}${p.unit ? ` (${p.unit})` : ""}` }))) ?? [];
  const keywordOptions = (kind === "beam" ? schema?.beam : schema?.input)?.map((k) => ({ value: k.key, label: `${k.key}  ·  ${pick(k.title)}` })) ?? [];
  const keywordSpec = (kind === "beam" ? schema?.beam : schema?.input)?.find((k) => k.key === keyword);
  const positionOptions = keywordSpec && keywordSpec.params.length > 1 ? keywordSpec.params.map((p, i) => ({ value: i + 1, label: `${i + 1}  ·  ${pick(p.label)}${p.unit ? ` (${p.unit})` : ""}` })) : [];

  const busy = state.running || run.running;
  const canStart = complete && !!values.trim() && !!check && check.count > 0 && !busy;

  const start = async () => {
    if (!canStart || !check) return;
    if (check.count > 20) {
      const ok = await confirmDialog(
        t("Run {n} simulations{est}?", { n: check.count, est: check.estimate_s ? ` (${t("about {time}", { time: fmtSeconds(check.estimate_s) })})` : "" }),
        { title: t("Parameter scan"), ok: t("Start") },
      );
      if (!ok) return;
    }
    try {
      const s = await call<ScanState>("scan.start", { spec, values: values.trim(), metrics, label });
      setState(s);
      if (s.result) setShown(s.result);
    } catch (e) {
      reportError(e, t("Parameter scan"));
    }
  };

  const stop = async () => {
    try {
      await call("scan.stop");
    } catch (e) {
      reportError(e);
    }
  };

  const openScan = async (item: ScanListItem) => {
    try {
      setShown(await call<Result>("scan.load", { folder: item.folder }));
    } catch (e) {
      reportError(e);
    }
  };

  const deleteScan = async (item: ScanListItem) => {
    const ok = await confirmDialog(t("Move scan {label} and all its files to the recycle bin?", { label: item.label }), { title: t("Delete"), ok: t("Move to recycle bin"), danger: true });
    if (!ok) return;
    try {
      await call("scan.delete", { folder: item.folder });
      if (shown && shown.folder === item.folder) setShown(null);
      loadScans();
    } catch (e) {
      reportError(e);
    }
  };

  return (
    <div className="page">
      <div className="page-inner">
        <PageHeader
          title={t("Parameter scan")}
          hint={t("Run the simulation once per value of one parameter. Each run works on a copy of the input files; the project's InputFile and OutputFile are not changed. Results are kept in Scans/ and can be opened on the Results page.")}
        />

        <Section title={t("What to scan")} icon="settings">
          <div className="row" style={{ gap: 16, marginBottom: 8 }}>
            <Radio checked={kind === "lattice"} onChange={() => setKind("lattice")} label={t("Lattice element parameter")} name="scan-kind" />
            <Radio checked={kind === "beam"} onChange={() => setKind("beam")} label="beam.txt" name="scan-kind" />
            <Radio checked={kind === "input"} onChange={() => setKind("input")} label="input.txt" name="scan-kind" />
          </div>
          <div className="form-grid">
            {kind === "lattice" ? (
              <>
                <Field label={t("Element")} hint={t("Elements of the lattice file used for the run ({name}).", { name: project.latticeName ?? "" })}>
                  <Select value={target} options={[{ value: "", label: t("(choose an element)") }, ...elementOptions]} onChange={(v) => { setTarget(v); setParam(""); }} />
                  <IconButton icon="refresh" tip={t("Reload the lattice")} onClick={loadElements} />
                </Field>
                <Field label={t("Parameter")}>
                  <Select value={param} options={[{ value: "", label: t("(choose a parameter)") }, ...paramOptions]} onChange={setParam} disabled={!chosen} />
                </Field>
              </>
            ) : (
              <>
                <Field label={t("Keyword")}>
                  <Select value={keyword} options={[{ value: "", label: t("(choose a keyword)") }, ...keywordOptions]} onChange={(v) => { setKeyword(v); setPosition(1); }} />
                </Field>
                {positionOptions.length > 0 && (
                  <Field label={t("Value")}>
                    <Select value={position} options={positionOptions} onChange={(v) => setPosition(Number(v))} />
                  </Field>
                )}
              </>
            )}
            <Field label={t("Values")} unit={check?.target.unit || undefined} hint={t("Comma-separated, or start:stop:count (e.g. 10:20:6). Current value: {v}", { v: check?.target.original ?? "–" })}>
              <CommitInput value={values} onCommit={setValues} placeholder="10, 12, 14  |  10:20:6" mono />
            </Field>
            <Field label={t("Name")} hint={t("Folder name under Scans/ (optional).")}>
              <CommitInput value={label} onCommit={setLabel} placeholder={check?.target.param ?? ""} />
            </Field>
          </div>
          {checkError && <div className="warning-text" style={{ marginTop: 8 }}>{checkError}</div>}
          {check && (
            <div className="muted" style={{ marginTop: 8 }}>
              {check.count > 0
                ? t("{n} simulations of {label}{est}", { n: check.count, label: check.target.label, est: check.estimate_s ? `, ${t("about {time}", { time: fmtSeconds(check.estimate_s) })}` : "" })
                : check.target.label}
            </div>
          )}
        </Section>

        <Section title={t("Results to collect")} icon="list-unordered">
          <div className="row scan-metrics">
            {metricsAll.all.map((m) => (
              <Checkbox key={m} checked={metrics.includes(m)} onChange={(v) => setMetrics((cur) => (v ? [...cur, m] : cur.filter((x) => x !== m)))} label={t(METRIC_LABEL[m] ?? m)} />
            ))}
          </div>
        </Section>

        <div className="row" style={{ gap: 8, margin: "4px 0 12px" }}>
          {state.running ? (
            <Button icon="debug-stop" onClick={stop}>
              {t("Stop scan")}
            </Button>
          ) : (
            <Button variant="primary" icon="play" disabled={!canStart} onClick={start} tip={run.running ? t("A simulation is already running; wait for it to finish.") : undefined}>
              {t("Start scan")}
            </Button>
          )}
          {state.running && (
            <>
              <Spinner />
              <span className="muted">{t("simulation {i} of {n}", { i: run.step ?? (state.result?.rows.length ?? 0) + 1, n: state.result?.values.length ?? "?" })}</span>
              <Button small variant="ghost" icon="pulse" onClick={() => setPage("run")}>
                {t("Show progress")}
              </Button>
            </>
          )}
        </div>

        {shown && <ScanResult result={shown} live={state.running && state.result?.folder === shown.folder} />}

        <Section title={t("Scans of this project")} icon="history" actions={<IconButton icon="refresh" tip={t("Refresh")} onClick={loadScans} />}>
          {scans.length === 0 ? (
            <div className="muted">{t("no scans yet")}</div>
          ) : (
            <div className="run-records">
              {scans.map((item) => (
                <div className={cx("run-record", shown?.folder === item.folder && "active")} key={item.folder}>
                  <div className="run-record-status">
                    <Badge tone={item.status === "finished" ? "success" : item.status === "running" ? "accent" : item.status === "failed" ? "danger" : "neutral"}>{runStatusLabel(item.status)}</Badge>
                  </div>
                  <div className="run-record-main">
                    <div className="run-record-title">{item.label}</div>
                    <div className="run-record-sub selectable">{[item.target?.label, t("{done} / {count} values", { done: item.done, count: item.count }), item.created].filter(Boolean).join("   ·   ")}</div>
                  </div>
                  <div className="run-record-actions">
                    <IconButton icon="table" tip={t("Show")} onClick={() => openScan(item)} />
                    <IconButton icon="folder" tip={t("Open folder")} onClick={() => openPath(item.folder).catch(reportError)} />
                    <IconButton icon="trash" className="run-record-delete" tip={t("Move to recycle bin")} disabled={state.running && state.result?.folder === item.folder} onClick={() => deleteScan(item)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function ScanResult({ result, live }: { result: Result; live: boolean }) {
  const t = useT();
  const dark = useApp((s) => s.resolvedTheme === "dark");
  const [metric, setMetric] = useState(result.metrics[0] ?? "");
  const rows = result.rows;
  const numeric = rows.filter((r) => typeof r[metric] === "number");
  const unit = result.target.unit ? ` (${result.target.unit})` : "";
  const data = useMemo(
    () => [{ type: "scatter" as const, mode: "lines+markers" as const, x: numeric.map((r) => r.value), y: numeric.map((r) => r[metric] as number), name: t(METRIC_LABEL[metric] ?? metric), marker: { size: 7 } }],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, metric, dark],
  );
  const layout = useMemo(
    () => ({ xaxis: { title: { text: `${result.target.param}${unit}` } }, yaxis: { title: { text: t(METRIC_LABEL[metric] ?? metric) } }, showlegend: false as const, margin: { t: 16 } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metric, result.target.param, unit],
  );
  return (
    <Section
      title={`${t("Scan")} ${result.label}: ${result.target.label}`}
      icon="graph-line"
      actions={
        <>
          <Select value={metric} options={result.metrics.map((m) => ({ value: m, label: t(METRIC_LABEL[m] ?? m) }))} onChange={setMetric} />
          <IconButton icon="folder" tip={t("Open folder")} onClick={() => openPath(result.folder).catch(reportError)} />
        </>
      }
      description={live ? t("Updating while the scan runs.") : result.finished ? `${runStatusLabel(result.status)}   ·   ${result.finished}` : undefined}
    >
      {numeric.length > 0 && (
        <div style={{ height: 260, position: "relative", marginBottom: 8 }}>
          <Plot data={data} layout={layout} style={{ position: "absolute", inset: 0 }} />
        </div>
      )}
      {rows.length === 0 ? (
        <Empty icon="graph-line" title={t("Waiting for the first simulation...")} />
      ) : (
        <div className="md-table-wrap">
          <table className="mini-table scan-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{result.target.param}{unit}</th>
                {result.metrics.map((m) => (
                  <th key={m}>{t(METRIC_LABEL[m] ?? m)}</th>
                ))}
                <th>{t("time")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.index} className={r.error ? "danger-text" : undefined}>
                  <td>{r.index}</td>
                  <td>{fmtG(r.value)}</td>
                  {result.metrics.map((m) => (
                    <td key={m}>{r.error && r[m] == null ? "" : typeof r[m] === "number" ? fmtG(r[m] as number, 5) : "–"}</td>
                  ))}
                  <td>{r.seconds != null ? fmtSeconds(r.seconds) : ""}</td>
                  <td>
                    {r.error ? (
                      <span className="selectable">{r.error}</span>
                    ) : r.output_dir ? (
                      <IconButton icon="graph-line" tip={t("Show results")} onClick={() => showResults(r.output_dir)} />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
