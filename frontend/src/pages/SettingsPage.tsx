import { PointerSettings } from "../components/PointerSettings";
import { call } from "../bridge";
import { Button, Checkbox, Icon, IconButton, Radio, Section, Spinner, TextInput } from "../components/ui";
import { fileSaved } from "../store/pages";
import { t, useT } from "../i18n";
import { useInputsLocked } from "../store/app";
import { NoProject, PageHeader, FormRow, RunLockBanner, useProjectOpen } from "./common";
import { useEditable } from "./useEditable";
import { PathPicker, isFloat, isInt } from "./widgets";
import { useEffect, useState } from "react";
import { reportError } from "../components/overlays";
import { FileHistoryButton } from "../files/FileHistory";
import { BOUNDARY_COLUMNS, scanDataColumns, TokenTable } from "../files/tables";

type Form = {
  sim_type: string;
  steppercycle: string;
  dumpperiodicity: string;
  randomseed: string;
  multithreading: boolean;
  scanphase: string;
  spacecharge: boolean;
  scmethod: string;
  numofgrid: string[];
  meshrms: string[];
  fieldSource: string;
  longlimits_start: boolean;
  longlimits_phase: string;
  longlimits_energy: string;
  boundary: boolean;
  pchistogram_start: boolean;
  pchistogram_grid: string;
  error_type: string;
  error_seed: string;
};
type Meta = { device: string; hadThreadsKey: boolean; hasScanData: boolean; inputPath: string; iniPath: string };
type Companion = { path: string; name: string; exists: boolean; text: string };
type Data = {
  form: Form;
  meta: Meta;
  /** input.txt as saved (the history dialog compares versions with it) */
  text: string;
  /** boundary.txt (read when boundary is on) and scanData.txt (read when scanphase is 2) */
  companions: { boundary: Companion; scanData: Companion };
  /** the history version the form was restored from, until the next save */
  restoredFrom?: string;
};

function validate(d: Data): string[] {
  const f = d.form;
  const errors: string[] = [];
  if (!f.steppercycle.trim()) errors.push(t("Simulation settings: steps per βλ is missing"));
  else if (!isInt(f.steppercycle) || Number(f.steppercycle) < 1) errors.push(t("Simulation settings: steps per βλ must be a positive integer"));
  if (f.dumpperiodicity.trim() && (!isInt(f.dumpperiodicity) || Number(f.dumpperiodicity) < 0))
    errors.push(t("Simulation settings: 'Output every N steps' must be an integer ≥ 0"));
  for (const [vals, name] of [
    [f.numofgrid, "numofgrid"],
    [f.meshrms, "meshrms"],
  ] as const) {
    const filled = vals.map((v) => v.trim());
    if (filled.some(Boolean) && !filled.every(Boolean)) errors.push(t("Simulation settings: {name} needs all three values (or none)", { name }));
    else if (filled.every(Boolean) && !filled.every((v) => (name === "numofgrid" ? isInt(v) : isFloat(v)))) errors.push(t("Simulation settings: {name} has an invalid value", { name }));
  }
  if (f.scanphase === "2" && !d.companions.scanData.text.trim()) errors.push(t("Simulation settings: phase scan mode 2 needs the entry phases in scanData.txt"));
  if (f.boundary && !d.companions.boundary.text.trim()) errors.push(t("Simulation settings: 'Apply boundary' is on but boundary.txt is empty"));
  if (f.error_type && !f.error_seed.trim()) errors.push(t("Simulation settings: error seed is missing"));
  return errors;
}

export default function SettingsPage() {
  const tt = useT();
  const open = useProjectOpen();
  const locked = useInputsLocked();
  const ed = useEditable<Data>({
    id: "settings",
    label: () => "input.txt / ini.ini",
    load: () => call<Data>("settings.load"),
    save: async (d) => {
      const res = await call<Data>("settings.save", {
        form: d.form,
        meta: d.meta,
        companions: { boundary: d.companions.boundary.text, scanData: d.companions.scanData.text },
        restoredFrom: d.restoredFrom ?? null,
      });
      for (const path of [d.meta.inputPath, d.meta.iniPath, d.companions.boundary.path, d.companions.scanData.path]) fileSaved(path, "settings");
      return res;
    },
    validate,
    files: (d) => (d ? [d.meta.inputPath, d.meta.iniPath, d.companions.boundary.path, d.companions.scanData.path] : []),
  });
  // rows of scanData.txt follow the RF cavities of the run lattice
  const [cavities, setCavities] = useState<string[]>([]);
  const wantCavities = ed.value?.form.scanphase === "2";
  useEffect(() => {
    if (wantCavities) call<string[]>("files.rfCavities").then(setCavities).catch(() => setCavities([]));
  }, [wantCavities]);

  if (!open) return <div className="page"><div className="page-inner"><PointerSettings /><NoProject /></div></div>;
  if (!ed.value) return <div className="empty-state">{ed.error ? <span className="danger-text">{ed.error}</span> : <Spinner size={24} />}</div>;

  const f = ed.value.form;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => ed.setValue((d) => ({ ...d, form: { ...d.form, [k]: v } }));
  const setTriple = (k: "numofgrid" | "meshrms", i: number, v: string) =>
    ed.setValue((d) => {
      const arr = [...d.form[k]];
      arr[i] = v;
      return { ...d, form: { ...d.form, [k]: arr } };
    });
  const sc = f.spacecharge;
  const comp = ed.value.companions;
  const setCompanion = (key: "boundary" | "scanData", text: string) =>
    ed.setValue((d) => ({ ...d, companions: { ...d.companions, [key]: { ...d.companions[key], text } } }));
  const restore = async (text: string, revision: string) => {
    if (locked) return;
    try {
      const form = await call<Form>("settings.parse", { text });
      ed.setValue((d) => ({ ...d, form, restoredFrom: revision }));
    } catch (e) {
      reportError(e);
    }
  };
  const missing = (c: Companion) => (c.exists ? undefined : tt("{name} does not exist yet; it is created when you save.", { name: c.name }));

  return (
    <div className="page">
      <div className="page-inner">
        <PageHeader
          title={tt("Simulation settings")}
          hint={tt("Tracking options written to input.txt, and the run mode stored in ini.ini.")}
          actions={
            <>
              <FileHistoryButton path={ed.value.meta.inputPath} getText={() => ed.value?.text ?? ""} onRestore={restore} />
              {(ed.canUndo || ed.canRedo) && (
                <>
                  <IconButton icon="discard" tip={`${tt("Undo")}  (Ctrl+Z)`} disabled={!ed.canUndo || locked} onClick={ed.undo} />
                  <IconButton icon="redo" tip={`${tt("Redo")}  (Ctrl+Y)`} disabled={!ed.canRedo || locked} onClick={ed.redo} />
                </>
              )}
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
        <Section title={tt("Plot interaction")} icon="settings-gear"><PointerSettings /></Section>
        <RunLockBanner />
        <fieldset className="lockable columns" disabled={locked}>
          <div>
            <Section title={tt("Model")} icon="symbol-class">
              <div className="form">
                <FormRow label={tt("Simulation type")}>
                  <div className="radio-row">
                    <Radio checked={f.sim_type === "mulp"} onChange={() => set("sim_type", "mulp")} label={tt("Multi-particle tracking")} />
                    <Radio checked={f.sim_type === "env"} disabled onChange={() => set("sim_type", "env")} label={tt("Envelope")} tip={tt("Envelope mode is not available in this version")} />
                  </div>
                </FormRow>
                <FormRow label={tt("Steps per βλ")}>
                  <TextInput value={f.steppercycle} invalid={!isInt(f.steppercycle)} onChange={(e) => set("steppercycle", e.target.value)} />
                </FormRow>
                <FormRow label={tt("Output every N steps (plt)")} tip={tt("0 = no particle dump (BeamSet.plt)")}>
                  <TextInput value={f.dumpperiodicity} invalid={!isInt(f.dumpperiodicity, true)} onChange={(e) => set("dumpperiodicity", e.target.value)} />
                </FormRow>
                <FormRow label={tt("Random seed of input beam")}>
                  <TextInput value={f.randomseed} invalid={!isInt(f.randomseed, true)} onChange={(e) => set("randomseed", e.target.value)} />
                </FormRow>
                <FormRow>
                  <Checkbox
                    checked={f.multithreading}
                    onChange={(v) => set("multithreading", v)}
                    label={tt("Multi-threaded tracking (multithreading)")}
                    tip={tt("Lets the engine use several CPU cores for one run.")}
                  />
                </FormRow>
                <FormRow
                  label={tt("Phase scan")}
                  tip={tt("scanphase keyword: 0 = fixed phases, 1 = scan cavity phases, 2 = read entry phases from scanData.txt. 'engine default' leaves it out.")}
                >
                  <div className="radio-row">
                    {[
                      ["default", tt("engine default")],
                      ["0", tt("off")],
                      ["1", tt("scan")],
                      ["2", tt("from scanData.txt")],
                    ].map(([v, l]) => (
                      <Radio key={v} checked={f.scanphase === v} onChange={() => set("scanphase", v)} label={l} />
                    ))}
                  </div>
                </FormRow>
              </div>
              {f.scanphase === "2" && (
                <div className="companion-table">
                  <div className="companion-title">
                    <Icon name="table" /> {tt("Cavity entry phases ({name})", { name: comp.scanData.name })}
                  </div>
                  <TokenTable
                    text={comp.scanData.text}
                    editable={!locked}
                    onChange={(text) => setCompanion("scanData", text)}
                    columns={scanDataColumns()}
                    rowLabels={cavities}
                    hint={missing(comp.scanData) ?? tt("One row per RF cavity, in lattice order.")}
                  />
                </div>
              )}
            </Section>

            <Section title={tt("Space charge")} icon="zap">
              <div className="form">
                <FormRow>
                  <Checkbox checked={sc} onChange={(v) => set("spacecharge", v)} label={tt("Include space charge")} />
                </FormRow>
                <FormRow label={tt("Solver")}>
                  <div className="radio-row">
                    {["FFT", "SPICNIC"].map((m) => (
                      <Radio key={m} disabled={!sc} checked={f.scmethod === m} onChange={() => set("scmethod", m)} label={m} />
                    ))}
                  </div>
                </FormRow>
                <FormRow label={tt("Grid Nx Ny Nz")}>
                  <div className="inline-group">
                    {[0, 1, 2].map((i) => (
                      <TextInput key={i} style={{ width: 70 }} disabled={!sc} value={f.numofgrid[i]} invalid={!!f.numofgrid[i] && !isInt(f.numofgrid[i])} onChange={(e) => setTriple("numofgrid", i, e.target.value)} />
                    ))}
                    <span className="hint">{tt("empty = engine default")}</span>
                  </div>
                </FormRow>
                <FormRow label={tt("Mesh size (x 2 rms)")}>
                  <div className="inline-group">
                    {[0, 1, 2].map((i) => (
                      <TextInput key={i} style={{ width: 70 }} disabled={!sc} value={f.meshrms[i]} invalid={!!f.meshrms[i] && !isFloat(f.meshrms[i])} onChange={(e) => setTriple("meshrms", i, e.target.value)} />
                    ))}
                    <span className="hint">{tt("empty = engine default")}</span>
                  </div>
                </FormRow>
              </div>
            </Section>

            <Section title={tt("Field maps")} icon="symbol-field">
              <div className="form">
                <FormRow label={tt("Directory")}>
                  <PathPicker value={f.fieldSource} onChange={(v) => set("fieldSource", v)} mode="folder" placeholder={tt("empty = InputFile/")} />
                </FormRow>
              </div>
            </Section>
          </div>

          <div>
            <Section title={tt("Limits and extra output")} icon="symbol-ruler">
              <div className="form">
                <FormRow>
                  <Checkbox checked={f.longlimits_start} onChange={(v) => set("longlimits_start", v)} label={tt("Longitudinal limits")} />
                </FormRow>
                <FormRow label={tt("Phase limit")} unit="deg">
                  <TextInput value={f.longlimits_phase} disabled={!f.longlimits_start} invalid={!isFloat(f.longlimits_phase)} onChange={(e) => set("longlimits_phase", e.target.value)} />
                </FormRow>
                <FormRow label={tt("Energy limit")} unit="MeV">
                  <TextInput value={f.longlimits_energy} disabled={!f.longlimits_start} invalid={!isFloat(f.longlimits_energy)} onChange={(e) => set("longlimits_energy", e.target.value)} />
                </FormRow>
                <FormRow>
                  <Checkbox checked={f.boundary} onChange={(v) => set("boundary", v)} label={tt("Apply boundary (boundary.txt)")} />
                </FormRow>
                {f.boundary && (
                  <div className="companion-table">
                    <TokenTable
                      text={comp.boundary.text}
                      editable={!locked}
                      onChange={(text) => setCompanion("boundary", text)}
                      columns={BOUNDARY_COLUMNS}
                      wrapStartEnd
                      hint={missing(comp.boundary) ?? tt("Loss boundary; the lattice apertures are ignored while it is applied.")}
                    />
                  </div>
                )}
                <FormRow>
                  <Checkbox checked={f.pchistogram_start} onChange={(v) => set("pchistogram_start", v)} label={tt("Write density file")} />
                </FormRow>
                <FormRow label={tt("Density grid")}>
                  <TextInput value={f.pchistogram_grid} disabled={!f.pchistogram_start} invalid={!isInt(f.pchistogram_grid)} onChange={(e) => set("pchistogram_grid", e.target.value)} />
                </FormRow>
              </div>
            </Section>

            <Section title={tt("Error study")} icon="debug-alt">
              <div className="form">
                <FormRow label={tt("Errors")} top>
                  <div className="radio-col">
                    {[
                      ["", tt("None")],
                      ["stat", tt("Static")],
                      ["dyn", tt("Dynamic")],
                      ["stat_dyn", tt("Static + dynamic")],
                    ].map(([v, l]) => (
                      <Radio key={v} checked={f.error_type === v} onChange={() => set("error_type", v)} label={l} />
                    ))}
                  </div>
                </FormRow>
                <FormRow label={tt("Seed")}>
                  <TextInput value={f.error_seed} disabled={!f.error_type} invalid={!!f.error_type && !isInt(f.error_seed)} onChange={(e) => set("error_seed", e.target.value)} />
                </FormRow>
                <FormRow>
                  <span className="muted">{tt("Error amplitudes are defined by err_* commands in the lattice file.")}</span>
                </FormRow>
              </div>
            </Section>
          </div>
        </fieldset>
      </div>
    </div>
  );
}
