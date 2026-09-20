import type { editor } from "monaco-editor";

export type HistoryState = { canUndo: boolean; canRedo: boolean };
export function historyState(model: editor.ITextModel): HistoryState {
  return { canUndo: model.canUndo(), canRedo: model.canRedo() };
}

// Toolbar commands must address this model even when Monaco is hidden/unfocused.
export async function runHistory(model: editor.ITextModel, action: "undo" | "redo", readOnly: boolean) {
  if (readOnly || !(action === "undo" ? model.canUndo() : model.canRedo())) return;
  await model[action]();
}

export function replaceModelText(model: editor.ITextModel, text: string) {
  if (model.getValue() === text) return;
  model.pushStackElement();
  model.pushEditOperations(null, [{ range: model.getFullModelRange(), text }], () => null);
  model.pushStackElement();
}
