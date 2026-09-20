import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TextEditorHandle } from "./TextEditor";

const env = vi.hoisted(() => ({ effects: [] as (() => unknown)[], editor: null as any }));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  forwardRef: (render: unknown) => render,
  useRef: (current: unknown) => ({ current }),
  useState: (initial: any) => [typeof initial === "function" ? initial() : initial, vi.fn()],
  useEffect: (effect: () => unknown) => { env.effects.push(effect); },
  useImperativeHandle: (ref: any, create: () => unknown) => { ref.current = create(); },
}));
vi.mock("../i18n", () => ({ useT: () => (text: string) => text }));
vi.mock("../store/app", () => ({ useApp: () => "dark" }));
vi.mock("./monaco", () => ({
  LANG: "avas-lattice", registerLattice: vi.fn(), defineThemes: vi.fn(), setMarkers: vi.fn(),
  monaco: {
    Range: class { constructor(public startLineNumber: number, public startColumn: number, public endLineNumber: number, public endColumn: number) {} },
    editor: { create: () => env.editor, CursorChangeReason: { Explicit: 3 },
      MouseTargetType: { CONTENT_TEXT: 6, CONTENT_EMPTY: 7, GUTTER_LINE_NUMBERS: 2 }, ScrollType: { Immediate: 1 } },
  },
}));
import { TextEditor } from "./TextEditor";

// Exercise the mounted editor's event/imperative boundary without a browser.
// The model fixture represents a separate history from any focused DOM input.
function mount(readOnly = false) {
  let text = "start\nField 0.35 0.02 0 3 0 1 0 v3h\nsuperpose 0\nend";
  let id = 1, nextId = 1;
  let undo: { text: string; id: number }[] = [], redo: { text: string; id: number }[] = [];
  const events: Record<string, (e?: any) => void> = {};
  const decorations = { set: vi.fn(), clear: vi.fn() };
  const content = (event = {}) => events.content?.(event);
  const model = {
    getAlternativeVersionId: () => id,
    getValue: () => text, getLinesContent: () => text.split("\n"),
    getLineCount: () => text.split("\n").length, getLineMaxColumn: () => 50,
    getFullModelRange: () => ({}), pushStackElement: vi.fn(),
    canUndo: () => undo.length > 0, canRedo: () => redo.length > 0,
    setValue: (value: string) => { text = value; id = ++nextId; undo = []; redo = []; content({ isFlush: true }); },
    pushEditOperations: (_before: unknown, edits: { text: string }[]) => {
      undo.push({ text, id }); text = edits[0].text; id = ++nextId; redo = []; content();
    },
    undo: vi.fn(() => { redo.push({ text, id }); ({ text, id } = undo.pop()!); content({ isUndoing: true }); }),
    redo: vi.fn(() => { undo.push({ text, id }); ({ text, id } = redo.pop()!); content({ isRedoing: true }); }),
  };
  env.editor = {
    getModel: () => model, getValue: () => text, updateOptions: vi.fn(),
    createDecorationsCollection: vi.fn().mockReturnValueOnce({ set: vi.fn() }).mockReturnValue(decorations),
    onDidChangeModelContent: (cb: any) => { events.content = cb; },
    onDidChangeCursorPosition: (cb: any) => { events.cursor = cb; },
    onMouseDown: (cb: any) => { events.mouse = cb; },
    trigger: vi.fn(), focus: vi.fn(),
  };
  const ref = { current: null as TextEditorHandle | null };
  const onCursorLine = vi.fn(), onChange = vi.fn(), onHistoryChange = vi.fn();
  (TextEditor as any)({ schema: { lattice: [] }, initialText: text, doc: null, readOnly, onCursorLine, onChange, onHistoryChange }, ref);
  env.effects.forEach((effect) => effect());
  return { handle: ref.current!, model, events, onCursorLine, onChange, onHistoryChange, decorations };
}

beforeEach(() => {
  env.effects = [];
  vi.stubGlobal("localStorage", { getItem: () => null, setItem: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

describe("lattice editor interactions", () => {
  it("tracks restoration through edits, undo, redo and successful save", () => {
    const { handle } = mount();
    handle.setText("ordinary edit", false);
    handle.setText("historical text", false, "revision-a");
    expect(handle.getRestoration()?.revision).toBe("revision-a");
    handle.setText("modified historical text", false);
    handle.undo();
    expect(handle.getRestoration()?.revision).toBe("revision-a");
    handle.undo();
    expect(handle.getRestoration()).toBeNull();
    handle.redo();
    const origin = handle.getRestoration();
    expect(origin?.revision).toBe("revision-a");
    handle.finishHistorySave(origin);
    handle.undo(); handle.redo();
    expect(handle.getRestoration()).toBeNull();
    handle.setText(handle.getText(), false, "no-op");
    expect(handle.getRestoration()).toBeNull();
  });

  it("undoes and redoes the hidden editor model without routing to a focused input", async () => {
    const { handle, model, onChange, onHistoryChange } = mount();
    const base = handle.getText();
    handle.setText("changed", false);
    handle.undo();
    await Promise.resolve();
    expect(handle.getText()).toBe(base);
    expect(onChange).toHaveBeenLastCalledWith(base);
    expect(onHistoryChange).toHaveBeenLastCalledWith({ canUndo: false, canRedo: true });
    handle.redo();
    await Promise.resolve();
    expect(handle.getText()).toBe("changed");
    expect(onChange).toHaveBeenLastCalledWith("changed");
    expect(model.redo).toHaveBeenCalledOnce();
    expect(env.editor.trigger).not.toHaveBeenCalled();
    expect(env.editor.focus).not.toHaveBeenCalled();
  });

  it("keeps restoring a session undoable and leaves read-only history untouched", async () => {
    const { handle, model } = mount();
    const base = handle.getText();
    handle.setText("edit one", false);
    handle.setText("edit two", false);
    handle.setText(base, false);
    expect(handle.getText()).toBe(base);
    expect(model.pushStackElement).toHaveBeenCalledTimes(6);
    handle.undo();
    expect(handle.getText()).toBe("edit two");
    handle.redo();
    expect(handle.getText()).toBe(base);
    await Promise.resolve();
    env.effects = [];
    const locked = mount(true);
    locked.handle.setText("approved replacement", false);
    locked.handle.undo();
    locked.handle.redo();
    expect(locked.handle.getText()).toBe("approved replacement");
    expect(locked.model.undo).not.toHaveBeenCalled();
    expect(locked.model.redo).not.toHaveBeenCalled();
  });

  it("selects the clicked Field line even if a mouse selection ends on superpose", () => {
    const { events, onCursorLine } = mount();
    const click = { event: { leftButton: true }, target: { type: 6, position: { lineNumber: 2 } } };
    events.mouse(click);
    events.cursor({ source: "mouse", reason: 3, position: { lineNumber: 3 } });
    expect(onCursorLine).toHaveBeenLastCalledWith(1);
    events.mouse(click);
    expect(onCursorLine).toHaveBeenCalledTimes(2);
    events.cursor({ source: "keyboard", reason: 3, position: { lineNumber: 3 } });
    expect(onCursorLine).toHaveBeenLastCalledWith(2);
  });

  it("does not change the selected component for cursor movement caused by edits or API navigation", () => {
    const { events, onCursorLine, decorations } = mount();
    events.mouse({ event: { leftButton: true }, target: { type: 2, position: { lineNumber: 2 } } });
    for (const [source, reason] of [["api", 3], ["modelChange", 1], ["undo", 5], ["redo", 6]]) {
      events.cursor({ source, reason, position: { lineNumber: 3 } });
    }
    expect(onCursorLine).toHaveBeenCalledExactlyOnceWith(1);
    expect(decorations.set).toHaveBeenCalledOnce();
  });
});
