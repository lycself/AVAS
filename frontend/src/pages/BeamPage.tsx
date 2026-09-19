import { useMemo, useState } from "react";
import { call } from "../bridge";
import { pickFile } from "../host";
import { confirmDialog, DialogFrame, reportError, showDialog, toast } from "../components/overlays";
import { Plot, seriesColor } from "../components/Plot";
import { Button, Checkbox, Section, Select, Spinner, TextInput } from "../components/ui";
import { fmtG } from "../format";
import { t, useT } from "../i18n";
import { useApp, useInputsLocked } from "../store/app";
import { fileSaved } from "../store/pages";
import { FormRow, NoProject, PageHeader, RunLockBanner, useProjectOpen } from "./common";
import { useEditable } from "./useEditable";
import { isFloat, isInt } from "./widgets";

type Form = Record<string, any> & {
  use_dst: boolean;
  dst: string;
  cw: boolean;
  distribution_x: string;
  distribution_y: string;
};
type Data = { form: Form; path: string; exists: boolean; dstFiles: string[] };

const DISTRIBUTIONS = ["GS", "WB", "PB", "KV"];
const PLANES = ["x", "y", "z"] as const;

function validate(d: Data): string[] {
  const f = d.form;
  const errors: string[] = [];
  if (!String(f.numofcharge).trim()) errors.push(t("Beam: charge is missing"));
  if (f.use_dst && !f.dst.trim()) errors.push(t("Beam: no particle file selected"));
  if (!f.use_dst) {
    const n = Number(f.particlenumber);
    if (!Number.isFinite(n) || n < 2) errors.push(t("Beam: multi-particle tracking needs at least 2 particles (currently {n})", { n: f.particlenumber || 0 }));
  }
  const bad = ["numofcharge", "particlenumber"].filter((k) => String(f[k]).trim() && !isInt(String(f[k])));
  const badF = ["particlerestmass", "current", "frequency", "kneticenergy", ...PLANES.flatMap((p) => [`alpha_${p}`, `beta_${p}`, `emit_${p}`])].filter(
    (k) => String(f[k]).trim() && !isFloat(String(f[k])),
  );
  if (bad.length || badF.length) errors.push(t("Beam: invalid number in {fields}", { fields: [...bad, ...badF].join(", ") }));
  return errors;
}

/** Ellipse gamma u^2 + 2 alpha u u' + beta u'^2 = eps, parametrised. */
function ellipse(alpha: number, beta: number, eps: number) {
  const x: number[] = [];
  const y: number[] = [];
  if (!(beta > 0) || !(eps > 0)) return { x, y };
  for (let i = 0; i <= 240; i++) {
    const th = (2 * Math.PI * i) / 240;
    x.push(Math.sqrt(eps * beta) * Math.cos(th));
    y.push(-Math.sqrt(eps / beta) * (alpha * Math.cos(th) + Math.sin(th)));
  }
  return { x, y };
}

function EllipsePreview({ form }: { form: Form }) {
  const tt = useT();
  const dark = useApp((s) => s.resolvedTheme === "dark");
  const [factor, setFactor] = useState("1");
  const k = Number(factor) || 1;
  const panels = PLANES.map((pl) => {
    const a = Number(form[`alpha_${pl}`]);
    const b = Number(form[`beta_${pl}`]);
    const e = Number(form[`emit_${pl}`]);
    return { pl, a, b, e, g: b > 0 ? (1 + a * a) / b : NaN };
  });
  const data = useMemo(
    () =>
      panels.flatMap((p, i) => {
        const suffix = i ? String(i + 1) : "";
        const rms = ellipse(p.a, p.b, p.e);
        const full = ellipse(p.a, p.b, p.e * k);
        return [
          { ...rms, type: "scatter", mode: "lines", name: "ε", line: { color: seriesColor("r", dark), width: 2 }, xaxis: `x${suffix}`, yaxis: `y${suffix}`, showlegend: i === 0 },
          ...(k !== 1
            ? [{ ...full, type: "scatter", mode: "lines", name: `${k} ε`, line: { color: seriesColor("b", dark), width: 1.5, dash: "dash" }, xaxis: `x${suffix}`, yaxis: `y${suffix}`, showlegend: i === 0 }]
            : []),
        ] as any[];
      }),
    [JSON.stringify(panels), k, dark],
  );
  const units = { x: ["x (mm)", "x' (mrad)"], y: ["y (mm)", "y' (mrad)"], z: ["z", "z'"] };
  const layout: any = {
    grid: { rows: 1, columns: 3, pattern: "independent" },
    margin: { l: 56, r: 16, t: 28, b: 48 },
    legend: { orientation: "h", x: 0, y: 1.14 },
  };
  PLANES.forEach((pl, i) => {
    const s = i ? String(i + 1) : "";
    layout[`xaxis${s}`] = { title: { text: units[pl][0] } };
    layout[`yaxis${s}`] = { title: { text: units[pl][1] } };
  });
  return (
    <div className="col" style={{ gap: 10 }}>
      <div className="row">
        <span className="muted">{tt("Ellipse γu² + 2αuu' + βu'² = ε drawn from the values as entered.")}</span>
        <div className="grow" />
        <span>{tt("Second ellipse")}</span>
        <TextInput value={factor} style={{ width: 60 }} invalid={!isFloat(factor)} onChange={(e) => setFactor(e.target.value)} />
        <span className="muted">× ε</span>
      </div>
      <Plot data={data} layout={layout} style={{ height: 340 }} />
      <table className="mini-table">
        <thead>
          <tr>
            <th />
            <th>α</th>
            <th>β</th>
            <th>γ</th>
            <th>ε</th>
            <th>√(βε)</th>
            <th>√(γε)</th>
          </tr>
        </thead>
        <tbody>
          {panels.map((p) => (
            <tr key={p.pl}>
              <td>{p.pl}</td>
              <td>{fmtG(p.a, 5)}</td>
              <td>{fmtG(p.b, 5)}</td>
              <td>{fmtG(p.g, 5)}</td>
              <td>{fmtG(p.e, 5)}</td>
              <td>{fmtG(Math.sqrt(p.b * p.e), 5)}</td>
              <td>{fmtG(Math.sqrt(p.g * p.e), 5)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BeamPage() {
  const tt = useT();
  const open = useProjectOpen();
  const inputDir = useApp((s) => s.project.inputDir);
  const [busy, setBusy] = useState(false);
  const [showEllipse, setShowEllipse] = useState(false);
  const locked = useInputsLocked();
  const ed = useEditable<Data>({
    id: "beam",
    label: () => "beam.txt",
    load: () => call<Data>("beam.load"),
    save: async (d) => {
      const res = await call<Data>("beam.save", { form: d.form });
      fileSaved(d.path, "beam");
      return res;
    },
    validate,
    files: (d) => (d ? [d.path] : []),
  });

  if (!open) return <NoProject />;
  if (!ed.value) return <div className="empty-state">{ed.error ? <span className="danger-text">{ed.error}</span> : <Spinner size={24} />}</div>;
  const f = ed.value.form;
  const set = (k: string, v: any) => ed.setValue((d) => ({ ...d, form: { ...d.form, [k]: v } }));

  const chooseDst = async () => {
    try {
      const path = await pickFile({ directory: inputDir, filters: ["DST (*.dst)", "All files (*.*)"] });
      if (!path) return;
      let res = await call<any>("beam.importDst", { source: path });
      if (res.exists) {
        const ok = await confirmDialog(tt("A file named {name} already exists in InputFile. Overwrite it?", { name: res.name }), { title: tt("File exists"), ok: tt("Overwrite"), danger: true });
        if (!ok) return;
        res = await call<any>("beam.importDst", { source: path, overwrite: true });
      }
      ed.setValue((d) => ({ ...d, form: { ...d.form, dst: res.name, use_dst: true }, dstFiles: d.dstFiles.includes(res.name) ? d.dstFiles : [...d.dstFiles, res.name] }));
    } catch (e) {
      reportError(e);
    }
  };

  const fillFromDst = async () => {
    if (!f.dst) return;
    setBusy(true);
    try {
      const vals = await call<Record<string, string>>("beam.fromDst", { name: f.dst });
      ed.setValue((d) => ({ ...d, form: { ...d.form, ...vals } }));
      toast(tt("Parameters filled from {name}", { name: f.dst }), "success");
    } catch (e) {
      reportError(e);
    } finally {
      setBusy(false);
    }
  };

  const row = (label: string, key: string, unit?: string, integer = false) => (
    <FormRow label={label} unit={unit ?? ""}>
      <TextInput value={f[key]} invalid={!!String(f[key]).trim() && !(integer ? isInt(f[key]) : isFloat(f[key]))} onChange={(e) => set(key, e.target.value)} />
    </FormRow>
  );

  const dstOptions = [...new Set([...(f.dst ? [f.dst] : []), ...ed.value.dstFiles])];

  return (
    <div className="page">
      <div className="page-inner">
        <PageHeader
          title={tt("Beam")}
          hint={tt("Initial beam: either generated from the parameters below or read from a particle (.dst) file.")}
          actions={
            <>
              {ed.dirty && (
                <Button variant="ghost" icon="discard" disabled={locked} onClick={ed.revert}>
                  {tt("Revert")}
                </Button>
              )}
              {ed.dirty && (
                <Button variant="primary" icon="save" disabled={locked} tip={tt("Ctrl+S saves all pages")} onClick={ed.saveNow}>
                  {tt("Save")}
                </Button>
              )}
            </>
          }
        />
        <RunLockBanner />
        <div className="columns">
          <div>
            <Section title={tt("Particle source")} icon="file-binary">
              <fieldset className="lockable form" disabled={locked}>
                <FormRow>
                  <Checkbox checked={f.use_dst} onChange={(v) => set("use_dst", v)} label={tt("Read particles from a .dst file")} />
                </FormRow>
                <FormRow label={tt("Particle file")}>
                  <Select
                    value={f.dst}
                    disabled={!f.use_dst}
                    options={[{ value: "", label: tt("(none)") }, ...dstOptions.map((n) => ({ value: n, label: n }))]}
                    onChange={(v) => set("dst", v)}
                  />
                  <Button disabled={!f.use_dst} onClick={chooseDst}>
                    {tt("Choose...")}
                  </Button>
                </FormRow>
                <FormRow>
                  <Button icon="arrow-down" disabled={!f.dst || busy} onClick={fillFromDst} tip={tt("Read mass, current, energy and Twiss parameters from the .dst file")}>
                    {tt("Fill parameters from file")}
                  </Button>
                  {busy && <Spinner />}
                </FormRow>
              </fieldset>
            </Section>
            <Section title={tt("Beam parameters")} icon="symbol-parameter">
              <fieldset className="lockable form" disabled={locked}>
                {row(tt("Charge"), "numofcharge", "e", true)}
                {row(tt("Rest mass"), "particlerestmass", "MeV")}
                {row(tt("Current"), "current", "mA")}
                {row(tt("Number of particles"), "particlenumber", "", true)}
                {row(tt("Frequency"), "frequency", "Hz")}
                {row(tt("Kinetic energy"), "kneticenergy", "MeV")}
                <FormRow>
                  <Checkbox checked={f.cw} onChange={(v) => set("cw", v)} label={tt("CW (DC) beam - no longitudinal Twiss")} />
                </FormRow>
              </fieldset>
            </Section>
          </div>
          <div>
            <Section title={tt("Distribution")} icon="graph-scatter">
              <fieldset className="lockable form" disabled={locked}>
                <FormRow label={tt("Transverse")}>
                  <Select value={f.distribution_x} options={DISTRIBUTIONS.map((d) => ({ value: d, label: d }))} onChange={(v) => set("distribution_x", v)} />
                </FormRow>
                <FormRow label={tt("Longitudinal")}>
                  <Select value={f.distribution_y} options={DISTRIBUTIONS.map((d) => ({ value: d, label: d }))} onChange={(v) => set("distribution_y", v)} />
                </FormRow>
              </fieldset>
            </Section>
            <Section
              title={tt("Twiss parameters and emittance")}
              icon="circle-large"
              actions={
                <Button small icon="eye" onClick={() => setShowEllipse(!showEllipse)}>
                  {showEllipse ? tt("Hide ellipses") : tt("Preview rms ellipses")}
                </Button>
              }
            >
              <fieldset className="lockable" disabled={locked}>
              <table className="twiss-table">
                <thead>
                  <tr>
                    <th />
                    <th>α</th>
                    <th>
                      β <span className="unit-inline">mm/π mrad</span>
                    </th>
                    <th>
                      ε <span className="unit-inline">π mm mrad</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PLANES.map((pl) => (
                    <tr key={pl}>
                      <td className="muted">{pl === "x" ? "xx'" : pl === "y" ? "yy'" : "zz'"}</td>
                      {["alpha", "beta", "emit"].map((q) => {
                        const key = `${q}_${pl}`;
                        const disabled = pl === "z" && f.cw;
                        return (
                          <td key={q}>
                            <TextInput
                              value={disabled ? "0" : f[key]}
                              disabled={disabled}
                              invalid={!disabled && !!String(f[key]).trim() && !isFloat(f[key])}
                              onChange={(e) => set(key, e.target.value)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              </fieldset>
            </Section>
          </div>
        </div>
        {showEllipse && (
          <Section title={tt("rms ellipses")} icon="circle-large">
            <EllipsePreview form={f} />
          </Section>
        )}
      </div>
    </div>
  );
}

export function openEllipseDialog(form: Form) {
  return showDialog<void>((close) => (
    <DialogFrame title={t("rms ellipses")} onClose={() => close()}>
      <EllipsePreview form={form} />
    </DialogFrame>
  ), { width: 1000 });
}
