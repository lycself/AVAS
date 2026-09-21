// Context menu and palette entries for structural lattice edits, shared by
// the structure tree, the visual editor and its inspector.
import { toast, type MenuItem } from "../components/overlays";
import { t } from "../i18n";
import {
  canEditStructure,
  defaultLength,
  deleteUnit,
  duplicateUnit,
  insertAfter,
  superposeWith,
  moveUnit,
  newElementText,
  type NewElementKind,
  type OpResult,
  type RangeEdit,
} from "./structureOps";
import type { LatticeDoc } from "./types";

export type ApplyRange = (edits: RangeEdit[], select?: number) => void;

export const PALETTE: { kind: NewElementKind; label: string; icon: string; color: string }[] = [
  { kind: "drift", label: "Drift", icon: "dash", color: "--el-drift" },
  { kind: "quad", label: "Quadrupole", icon: "symbol-constant", color: "--el-quad" },
  { kind: "solenoid", label: "Solenoid", icon: "symbol-namespace", color: "--el-solenoid" },
  { kind: "field_rf", label: "RF cavity", icon: "pulse", color: "--el-rf" },
  { kind: "field_b", label: "Magnet", icon: "symbol-field", color: "--el-bmag" },
  { kind: "field_e", label: "Electrostatic", icon: "zap", color: "--el-efield" },
  { kind: "bend", label: "Dipole", icon: "debug-step-over", color: "--el-bend" },
  { kind: "steerer", label: "Steerer", icon: "arrow-up", color: "--el-steerer" },
  { kind: "diag_size", label: "Size target", icon: "target", color: "--el-diag" },
  { kind: "diag_position", label: "Position target", icon: "target", color: "--el-diag" },
  { kind: "diag_energy", label: "Energy target", icon: "target", color: "--el-diag" },
  { kind: "outputplane", label: "Output plane", icon: "output", color: "--el-other" },
];

export function applyResult(result: OpResult, apply: ApplyRange): boolean {
  if ("error" in result) {
    toast(result.error, "warning");
    return false;
  }
  if (!result.edits.length) return false;
  apply(result.edits, result.select);
  if (result.message) toast(result.message, "info", 5000);
  return true;
}

export function elementOptions(doc: LatticeDoc, line: number | null, frequency?: number) {
  const st = line != null ? doc.statements.find((s) => s.line === line) : undefined;
  const r = st && st.isElement ? Number(st.params[1]) : NaN;
  return { aperture: Number.isFinite(r) && r > 0 ? r : undefined, frequency };
}

export function structureMenu(doc: LatticeDoc, text: () => string[], line: number, apply: ApplyRange, opts: { readOnly?: boolean; frequency?: number; onShowText?: () => void } = {}): MenuItem[] {
  const st = doc.statements.find((s) => s.line === line);
  if (!st) return [];
  const ro = !!opts.readOnly;
  const editable = canEditStructure(doc, line) && !ro;
  const run = (fn: () => OpResult) => () => applyResult(fn(), apply);
  return [
    {
      label: t("Add superposed element"), icon: "add", disabled: ro || !st.isElement || !st.active,
      submenu: PALETTE.map((p) => ({ label: t(p.label),
        onClick: run(() => superposeWith(doc, text(), line, newElementText(p.kind, elementOptions(doc, line, opts.frequency)))),
      })),
    },
    {
      label: st.block != null ? t("Insert after group") : t("Insert after"),
      icon: "add",
      disabled: ro || st.key === "end",
      submenu: PALETTE.map((p) => ({
        label: t(p.label),
        onClick: run(() => insertAfter(doc, text(), line, newElementText(p.kind, { ...elementOptions(doc, line, opts.frequency), length: defaultLength(p.kind) }))),
      })),
    },
    { label: t("Duplicate"), icon: "copy", shortcut: "Ctrl+D", disabled: !editable, onClick: run(() => duplicateUnit(doc, text(), line)) },
    { type: "separator" },
    { label: st.block != null ? t("Move whole group up") : t("Move up"), icon: "arrow-up", shortcut: "Alt+↑", disabled: !editable, onClick: run(() => moveUnit(doc, text(), line, -1)) },
    { label: st.block != null ? t("Move whole group down") : t("Move down"), icon: "arrow-down", shortcut: "Alt+↓", disabled: !editable, onClick: run(() => moveUnit(doc, text(), line, 1)) },
    { type: "separator" },
    { label: t("Delete"), icon: "trash", shortcut: "Del", danger: true, disabled: !editable, onClick: run(() => deleteUnit(doc, text(), line)) },
    ...(opts.onShowText ? [{ type: "separator" as const }, { label: t("Show in text"), icon: "go-to-file", onClick: opts.onShowText }] : []),
  ];
}
