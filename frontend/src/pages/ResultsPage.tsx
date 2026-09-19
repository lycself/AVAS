import { useCallback, useEffect, useRef, useState } from "react";
import { call, on } from "../bridge";
import { openPath, pickFile, pickFolder } from "../host";
import { reportError, toast } from "../components/overlays";
import { Button, cx, Empty, Icon, IconButton, Radio, Select, Spinner, Tabs, TextInput } from "../components/ui";
import { runStatusLabel } from "../format";
import { useT } from "../i18n";
import { AcceptanceFooter, PlotTab } from "../results/PlotTab";
import { PhaseViewer } from "../results/PhaseViewer";
import { useApp } from "../store/app";
import { NoProject, PageHeader } from "./common";

type Overview = {
  outputDir: string;
  defaultOutput: string;
  inputDir: string;
  hasDataSet: boolean;
  hasPlt: boolean;
  dst: string[];
  plt: string[];
  errors: string[];
  density: string[];
  cavities: string[];
};

type ItemKey =
  | "envelope"
  | "emittance"
  | "loss"
  | "energy"
  | "phase_advance"
  | "syn_phase"
  | "cavity_voltage"
  | "dst_viewer"
  | "plt_viewer"
  | "err_emit_loss"
  | "err_out"
  | "err_density"
  | "acceptance"
  | "expand"
  | "plt2dst";

const TREE: { group: string; items: { key: ItemKey; label: string; icon: string }[] }[] = [
  {
    group: "Beam along the lattice",
    items: [
      { key: "envelope", label: "Envelope / centroid / beta", icon: "graph-line" },
      { key: "emittance", label: "Emittance", icon: "graph-line" },
      { key: "loss", label: "Particle loss", icon: "graph-line" },
      { key: "energy", label: "Energy", icon: "graph-line" },
      { key: "phase_advance", label: "Phase advance", icon: "graph-line" },
      { key: "syn_phase", label: "Synchronous phase", icon: "graph-scatter" },
      { key: "cavity_voltage", label: "Cavity voltage", icon: "graph" },
    ],
  },
  {
    group: "Phase space",
    items: [
      { key: "dst_viewer", label: "Particle file viewer (.dst)", icon: "circle-large" },
      { key: "plt_viewer", label: "Step viewer (.plt)", icon: "circle-large" },
    ],
  },
  {
    group: "Error study",
    items: [
      { key: "err_emit_loss", label: "Emittance growth and loss", icon: "graph-line" },
      { key: "err_out", label: "Output parameters", icon: "graph-line" },
      { key: "err_density", label: "Density", icon: "symbol-color" },
    ],
  },
  {
    group: "Tools",
    items: [
      { key: "acceptance", label: "Acceptance", icon: "target" },
      { key: "expand", label: "Expand particle number", icon: "add" },
      { key: "plt2dst", label: "Convert plt step to dst", icon: "export" },
    ],
  },
];

const ENVELOPE = ["rms_x", "rms_y", "rms_xy", "max_x", "max_y", "max_xy", "c_x", "c_y", "c_xy", "phi", "beta_x", "beta_y", "beta_z", "beta_xyz", "alpha_x"];

type Tab = { id: string; key: ItemKey; title: string };

function basename(p: string) {
  return p.split(/[\\/]/).pop() ?? p;
}

function Opt({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="opt">
      <span className="muted">{label}</span>
      {children}
    </span>
  );
}

function FilePick({ value, files, onChange, filters, directory }: { value: string; files: string[]; onChange: (v: string) => void; filters: string[]; directory: string }) {
  const t = useT();
  const opts = [...new Set([...files, ...(value ? [value] : [])])];
  return (
    <>
      <Select
        value={value}
        style={{ minWidth: 220, maxWidth: 380 }}
        options={[{ value: "", label: opts.length ? t("(choose a file)") : t("(no files found)") }, ...opts.map((f) => ({ value: f, label: basename(f) }))]}
        onChange={onChange}
      />
      <IconButton
        icon="folder-opened"
        tip={t("Other file...")}
        onClick={async () => {
          try {
            const p = await pickFile({ directory, filters });
            if (p) onChange(p);
          } catch (e) {
            reportError(e);
          }
        }}
      />
    </>
  );
}

function TabContent({ tab, ov, refreshKey }: { tab: Tab; ov: Overview; refreshKey: number }) {
  const t = useT();
  const out = ov.outputDir;
  const [type, setType] = useState(tab.key === "emittance" ? "emittance_x" : tab.key === "loss" ? "loss" : tab.key === "energy" ? "energy" : "rms_x");
  const [unit, setUnit] = useState("period");
  const [ratios, setRatios] = useState<Record<string, string>>({});
  const [appliedRatios, setAppliedRatios] = useState<Record<string, string>>({});
  const [errFile, setErrFile] = useState(ov.errors.find((f) => /errors_par\.txt$/i.test(f)) ?? ov.errors[0] ?? "");
  const [stat, setStat] = useState("average");
  const [quantity, setQuantity] = useState("xy");
  const [densFile, setDensFile] = useState(ov.density[0] ?? "");
  const [plane, setPlane] = useState("x");
  const [dkind, setDkind] = useState("density");
  const [accKind, setAccKind] = useState(0);

  switch (tab.key) {
    case "envelope":
    case "emittance":
    case "loss":
    case "energy": {
      const choices = tab.key === "envelope" ? ENVELOPE : tab.key === "emittance" ? ["emittance_x", "emittance_y", "emittance_z"] : [tab.key];
      return (
        <PlotTab
          plot="dataset"
          params={{ type }}
          outputDir={out}
          title={type}
          refreshKey={refreshKey}
          options={
            choices.length > 1 && (
              <Opt label={t("Quantity")}>
                <Select value={type} options={choices.map((c) => ({ value: c, label: c }))} onChange={setType} />
              </Opt>
            )
          }
        />
      );
    }
    case "phase_advance":
      return (
        <PlotTab
          plot="phase_advance"
          params={{ unit }}
          outputDir={out}
          title="phase_advance"
          refreshKey={refreshKey}
          options={
            <Opt label={t("Unit")}>
              <Select
                value={unit}
                options={[
                  { value: "period", label: t("per period") },
                  { value: "meter", label: t("per meter") },
                ]}
                onChange={setUnit}
              />
            </Opt>
          }
        />
      );
    case "syn_phase":
      return <PlotTab plot="syn_phase" params={{}} outputDir={out} title="syn_phase" refreshKey={refreshKey} />;
    case "cavity_voltage":
      return (
        <PlotTab
          plot="cavity_voltage"
          params={{ ratio: appliedRatios }}
          outputDir={out}
          title="cavity_voltage"
          refreshKey={refreshKey}
          options={
            <span className="opt wrap">
              <span className="muted">{t("Voltage ratio per field")}</span>
              {ov.cavities.map((name) => (
                <span key={name} className="opt">
                  <span className="mono">{name}</span>
                  <TextInput
                    value={ratios[name] ?? "1"}
                    style={{ width: 60 }}
                    invalid={!Number.isFinite(Number(ratios[name] ?? "1"))}
                    onChange={(e) => setRatios((r) => ({ ...r, [name]: e.target.value }))}
                    onBlur={() => setAppliedRatios({ ...ratios })}
                    onKeyDown={(e) => e.key === "Enter" && setAppliedRatios({ ...ratios, [name]: (e.target as HTMLInputElement).value })}
                  />
                </span>
              ))}
            </span>
          }
        />
      );
    case "err_emit_loss":
      return (
        <PlotTab
          plot="err_emit_loss"
          params={{ path: errFile }}
          outputDir={out}
          title="emittance_growth_loss"
          refreshKey={refreshKey}
          options={
            <Opt label={t("File")}>
              <FilePick value={errFile} files={ov.errors} onChange={setErrFile} filters={["Text (*.txt)"]} directory={out} />
            </Opt>
          }
        />
      );
    case "err_out":
      return (
        <PlotTab
          plot="err_out"
          params={{ path: errFile, stat, type: quantity }}
          outputDir={out}
          title={`error_${stat}_${quantity}`}
          refreshKey={refreshKey}
          options={
            <>
              <Opt label={t("File")}>
                <FilePick value={errFile} files={ov.errors} onChange={setErrFile} filters={["Text (*.txt)"]} directory={out} />
              </Opt>
              <Opt label={t("Statistic")}>
                <Select
                  value={stat}
                  options={[
                    { value: "average", label: t("average") },
                    { value: "rms", label: "rms" },
                  ]}
                  onChange={setStat}
                />
              </Opt>
              <Opt label={t("Quantity")}>
                <Select
                  value={quantity}
                  options={[
                    { value: "xy", label: "X & Y" },
                    { value: "x1y1", label: "X' & Y'" },
                    { value: "rms_xy", label: "rms(X) & rms(Y)" },
                    { value: "rms_x1y1", label: "rms(X') & rms(Y')" },
                    { value: "ek", label: t("Energy change") },
                  ]}
                  onChange={setQuantity}
                />
              </Opt>
            </>
          }
        />
      );
    case "err_density":
      return (
        <PlotTab
          plot="density"
          params={{ path: densFile, plane, kind: dkind }}
          outputDir={out}
          title={`density_${dkind}_${plane}`}
          refreshKey={refreshKey}
          options={
            <>
              <Opt label={t("File")}>
                <FilePick value={densFile} files={ov.density} onChange={setDensFile} filters={["Density (*.dat)"]} directory={out} />
              </Opt>
              <Opt label={t("Plane")}>
                <Select value={plane} options={["x", "y", "r", "z"].map((p) => ({ value: p, label: p }))} onChange={setPlane} />
              </Opt>
              <Opt label={t("Plot")}>
                <Select
                  value={dkind}
                  options={[
                    { value: "density", label: t("Density") },
                    { value: "density_level", label: t("Density level") },
                    { value: "centroid", label: t("Centroid") },
                    { value: "emit", label: t("Emittance") },
                    { value: "rms_size", label: t("Rms size") },
                    { value: "rms_size_max", label: t("Rms size max") },
                  ]}
                  onChange={setDkind}
                />
              </Opt>
            </>
          }
        />
      );
    case "acceptance":
      return (
        <PlotTab
          plot="acceptance"
          params={{ kind: accKind }}
          outputDir={out}
          title="acceptance"
          refreshKey={refreshKey}
          options={
            <Opt label={t("Plane")}>
              <span className="radio-row">
                {["x-x'", "y-y'", "z-z'", "φ-E"].map((l, i) => (
                  <Radio key={i} checked={accKind === i} onChange={() => setAccKind(i)} label={l} />
                ))}
              </span>
            </Opt>
          }
          footer={(fig) => <AcceptanceFooter fig={fig} />}
        />
      );
    case "dst_viewer":
      return <PhaseViewer source={{ kind: "dst", files: ov.dst }} outputDir={out} refreshKey={refreshKey} />;
    case "plt_viewer":
      return ov.plt.length ? (
        <PhaseViewer source={{ kind: "plt", files: ov.plt }} outputDir={out} refreshKey={refreshKey} />
      ) : (
        <Empty icon="info" title={t("No .plt file in the results folder")}>
          {t("Set 'Output every N steps (plt)' to a value > 0 on the Settings page and run the simulation again.")}
        </Empty>
      );
    case "expand":
      return <ExpandTool ov={ov} />;
    case "plt2dst":
      return <PltToDstTool ov={ov} />;
  }
}

function ExpandTool({ ov }: { ov: Overview }) {
  const t = useT();
  const [input, setInput] = useState(ov.dst[0] ?? "");
  const [factor, setFactor] = useState("10");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  useEffect(
    () =>
      on("tools.expand", (r: { ok: boolean; output: string }) => {
        setRunning(false);
        setResult(r.ok ? t("Written: {path}", { path: r.output }) : t("The expansion failed; see the log."));
        if (r.ok) toast(t("Particle expansion finished"), "success");
      }),
    [t],
  );
  return (
    <div className="tool-panel">
      <div className="form">
        <div className="form-label">{t("Input .dst")}</div>
        <div className="form-field">
          <FilePick value={input} files={ov.dst} onChange={setInput} filters={["DST (*.dst)"]} directory={ov.outputDir} />
        </div>
        <div className="form-label">{t("Multiply particle number by")}</div>
        <div className="form-field">
          <TextInput value={factor} style={{ width: 90 }} onChange={(e) => setFactor(e.target.value)} />
        </div>
        <div className="form-label">{t("Output")}</div>
        <div className="form-field muted selectable">{ov.outputDir}\change_num_result.dst</div>
        <div />
        <div className="form-field">
          <Button
            variant="primary"
            icon="play"
            disabled={running || !input}
            onClick={async () => {
              try {
                setResult(null);
                await call("tools.expand", { input, ratio: factor });
                setRunning(true);
              } catch (e) {
                reportError(e);
              }
            }}
          >
            {t("Start")}
          </Button>
          <Button
            icon="debug-stop"
            disabled={!running}
            onClick={async () => {
              await call("tools.expandStop");
              setRunning(false);
            }}
          >
            {t("Stop")}
          </Button>
          {running && <Spinner />}
        </div>
      </div>
      {result && <p className="selectable">{result}</p>}
    </div>
  );
}

function PltToDstTool({ ov }: { ov: Overview }) {
  const t = useT();
  const [info, setInfo] = useState<{ steps: number; items: { step: number; location: number }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState("0");
  const plt = ov.plt.find((p) => /BeamSet\.plt$/i.test(p)) ?? ov.plt[0];
  useEffect(() => {
    if (!plt) return;
    call<any>("phase.pltInfo", { path: plt })
      .then(setInfo)
      .catch((e) => setError(e.message));
  }, [plt]);
  const item = info?.items[Number(step)];
  return (
    <div className="tool-panel">
      <div className="form">
        <div className="form-label">{t("plt file")}</div>
        <div className="form-field muted selectable">{plt ?? t("BeamSet.plt not found in the results folder.")}</div>
        <div className="form-label">{t("Steps in file")}</div>
        <div className="form-field">{info ? info.steps : error ?? "–"}</div>
        <div className="form-label">{t("Step to export")}</div>
        <div className="form-field">
          <TextInput value={step} style={{ width: 90 }} onChange={(e) => setStep(e.target.value)} />
          {item && <span className="muted">z = {item.location.toPrecision(5)} m</span>}
        </div>
        <div />
        <div className="form-field">
          <Button
            variant="primary"
            icon="export"
            disabled={!info}
            onClick={async () => {
              try {
                const r = await call<{ output: string }>("tools.pltToDst", { step: Number(step), path: plt });
                toast(t("Written: {path}", { path: r.output }), "success", 5000);
              } catch (e) {
                reportError(e);
              }
            }}
          >
            {t("Write dst")}
          </Button>
        </div>
      </div>
    </div>
  );
}

type ResultSource = {
  kind: "project" | "segment";
  label: string;
  outputDir: string;
  status?: string | null;
  time?: string | null;
  zStart?: number;
  zEnd?: number;
  entry?: string | null;
};

const ENTRY_LABEL: Record<string, string> = {
  beam: "beam.txt",
  dst: "particle file of the full run",
  upstream: "upstream simulated first",
  twiss: "Twiss beam (approximate)",
  segment: "exit beam of an earlier segment run",
};

const ENTRY_SHORT: Record<string, string> = {
  beam: "beam.txt",
  dst: "particle file",
  segment: "from previous segment",
  upstream: "with upstream",
  twiss: "Twiss beam",
};

function samePath(a?: string, b?: string) {
  return !!a && !!b && a.replace(/[\\/]+$/, "").toLowerCase() === b.replace(/[\\/]+$/, "").toLowerCase();
}

export default function ResultsPage() {
  const tt = useT();
  const project = useApp((s) => s.project);
  const lastFinished = useApp((s) => s.lastFinished);
  const request = useApp((s) => s.resultsRequest);
  const [outputDir, setOutputDir] = useState<string | undefined>(request?.outputDir);
  const [ov, setOv] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [active, setActive] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [sources, setSources] = useState<ResultSource[]>([]);

  const loadOverview = useCallback(async () => {
    try {
      setOv(await call<Overview>("results.overview", { outputDir }));
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }, [outputDir]);

  const loadSources = useCallback(async () => {
    try {
      setSources(await call<ResultSource[]>("results.sources"));
    } catch {
      setSources([]);
    }
  }, []);

  const lastProject = useRef(project.path);
  useEffect(() => {
    if (lastProject.current === project.path) return;
    lastProject.current = project.path;
    setOutputDir(undefined);
    setTabs([]);
  }, [project.path]);

  useEffect(() => {
    if (project.open) {
      loadOverview();
      loadSources();
    }
  }, [project.open, project.path, loadOverview, loadSources]);

  // "Show results" of a run: switch to its folder
  const handled = useRef<number | null>(null);
  useEffect(() => {
    if (!request || handled.current === request.nonce) return;
    handled.current = request.nonce;
    if (!samePath(request.outputDir, outputDir) && (request.outputDir || outputDir)) {
      setOutputDir(request.outputDir);
      setTabs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  // new results after a successful run
  useEffect(() => {
    if (lastFinished?.ok) {
      loadOverview();
      loadSources();
      setRefreshKey((k) => k + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastFinished]);

  const shownDir = ov?.outputDir ?? outputDir ?? project.outputDir;
  const current = sources.find((s) => (outputDir ? samePath(s.outputDir, outputDir) : s.kind === "project"));
  const sourceOptions = sources.map((s) => ({
    value: s.outputDir,
    label:
      s.kind === "project"
        ? `${tt("Full lattice")} (OutputFile)`
        : [
            tt("Segment {label}", { label: s.label }),
            `z ${s.zStart ?? "?"}–${s.zEnd ?? "?"} m`,
            s.entry ? tt(ENTRY_SHORT[s.entry] ?? s.entry) : null,
            s.time ?? "",
            s.status && s.status !== "finished" ? runStatusLabel(s.status) : null,
          ]
            .filter(Boolean)
            .join("  ·  "),
  }));
  if (outputDir && !current) sourceOptions.push({ value: outputDir, label: tt("Other folder") });
  const pickSource = (dir: string) => {
    const src = sources.find((s) => samePath(s.outputDir, dir));
    const next = src?.kind === "project" ? undefined : dir;
    if (samePath(next, outputDir) || (!next && !outputDir)) return;
    setOutputDir(next);
    setTabs([]);
  };

  if (!project.open) return <NoProject />;

  const openItem = (key: ItemKey, label: string, forceNew: boolean) => {
    const existing = tabs.find((t) => t.key === key);
    if (existing && !forceNew) {
      setActive(existing.id);
      return;
    }
    const id = `${key}-${Date.now()}`;
    setTabs((ts) => [...ts, { id, key, title: label }]);
    setActive(id);
  };

  const closeTab = (id: string) => {
    setTabs((ts) => {
      const idx = ts.findIndex((t) => t.id === id);
      const next = ts.filter((t) => t.id !== id);
      if (active === id) setActive(next[Math.max(0, idx - 1)]?.id ?? "");
      return next;
    });
  };

  const refreshAll = () => {
    loadOverview();
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="page-fill">
      <PageHeader
        title={tt("Results")}
        hint={tt("Plots are drawn from the results folder (OutputFile/ of the project by default). Drag to zoom, double-click to reset; 'Save image' writes a publication-quality figure.")}
      />
      <div className="row" style={{ gap: 8 }}>
        <span className="muted">{tt("Results")}</span>
        {sourceOptions.length > 0 ? (
          <Select
            value={outputDir ?? sources.find((s) => s.kind === "project")?.outputDir ?? ""}
            options={sourceOptions}
            onChange={pickSource}
            style={{ minWidth: 260, maxWidth: 520 }}
            tip={shownDir}
          />
        ) : (
          <span className="selectable ellipsis" style={{ maxWidth: 640 }} data-tip={shownDir}>
            {shownDir}
          </span>
        )}
        <Button
          small
          icon="folder-opened"
          tip={tt("Open another results folder")}
          onClick={async () => {
            const p = await pickFolder({ directory: ov?.outputDir ?? "", title: tt("Open another results folder") });
            if (p) {
              setOutputDir(p);
              setTabs([]);
            }
          }}
        >
          {tt("Choose...")}
        </Button>
        <div className="grow" />
        <Button
          small
          variant="ghost"
          icon="refresh"
          onClick={() => {
            refreshAll();
            loadSources();
          }}
        >
          {tt("Refresh all")}
        </Button>
        <Button small variant="ghost" icon="folder" onClick={() => openPath(shownDir).catch(reportError)}>
          {tt("Open folder")}
        </Button>
      </div>
      {current?.kind === "segment" && (
        <div className="muted results-source-note">
          {tt("Segment run: z starts at 0 at the segment entry (z = {z} m of the full lattice). Entry beam: {entry}.", {
            z: current.zStart ?? "?",
            entry: tt(ENTRY_LABEL[current.entry ?? ""] ?? current.entry ?? "–"),
          })}
        </div>
      )}
      <div className="results-layout">
        <div className="results-tree">
          {TREE.map((g) => (
            <div key={g.group}>
              <div className="files-group">{tt(g.group)}</div>
              {g.items.map((it) => (
                <div
                  key={it.key}
                  className={cx("files-item", tabs.find((t) => t.id === active)?.key === it.key && "active")}
                  onClick={(e) => openItem(it.key, tt(it.label), e.ctrlKey)}
                  data-tip={tt("Ctrl+click opens another tab")}
                >
                  <Icon name={it.icon} />
                  <span className="grow ellipsis">{tt(it.label)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="results-main">
          {error ? (
            <div className="empty-state danger-text">{error}</div>
          ) : !ov ? (
            <div className="empty-state">
              <Spinner size={24} />
            </div>
          ) : tabs.length === 0 ? (
            <Empty icon="graph-line" title={tt("Pick an item on the left to open a plot here.")}>
              {!ov.hasDataSet && <span className="warning-text">{tt("No DataSet.txt in this folder yet: run the simulation first.")}</span>}
            </Empty>
          ) : (
            <>
              <Tabs
                value={active}
                onChange={setActive}
                tabs={tabs.map((tb) => ({ value: tb.id, label: tb.title, onClose: () => closeTab(tb.id) }))}
              />
              {tabs.map((tb) => (
                <div key={tb.id} className="results-tab" style={{ display: tb.id === active ? "flex" : "none" }}>
                  <TabContent tab={tb} ov={ov} refreshKey={refreshKey} />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
