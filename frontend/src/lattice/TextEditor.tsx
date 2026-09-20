import { createRestorationTracker, type RestorationHandle } from "../files/restorationOrigin";
// Monaco-based text editor for lattice files.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { IconButton, Segmented } from "../components/ui";
import { useT } from "../i18n";
import { useApp } from "../store/app";
import { defineThemes, LANG, monaco, registerLattice, setMarkers } from "./monaco";
import type { RangeEdit } from "./structureOps";
import type { Edit, LatticeDoc, Schema } from "./types";
import { historyState, replaceModelText, runHistory, type HistoryState } from "./editorHistory";

export type TextEditorHandle = RestorationHandle & {
  getText: () => string;
  /** Replace the whole text; clears undo history when *resetUndo*. */
  setText: (text: string, resetUndo?: boolean, revision?: string) => void;
  /** Whole-line replacements as one undo step. */
  applyEdits: (edits: Edit[]) => void;
  /** Line-range replacements / insertions / deletions as one undo step. */
  applyRangeEdits: (edits: RangeEdit[]) => void;
  revealLine: (line0: number) => void;
  focus: () => void;
  undo: () => void;
  redo: () => void;
};

type Props = {
  schema: Schema;
  initialText: string;
  readOnly?: boolean;
  doc: LatticeDoc | null;
  onChange: (text: string) => void;
  onCursorLine?: (line0: number) => void;
  onHistoryChange?: (state: HistoryState) => void;
};

const NL = String.fromCharCode(10);
const ELEMENT_KEYS = new Set(["drift", "field", "quad", "solenoid", "bend", "steerer", "edge", "diag_energy", "diag_size", "diag_position"]);

export const TextEditor = forwardRef<TextEditorHandle, Props>(function TextEditor({ schema, initialText, readOnly, doc, onChange, onCursorLine, onHistoryChange }, ref) {
  const t = useT();
  const restoration = useRef(createRestorationTracker());
  const host = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const syncing = useRef(false);
  const cb = useRef({ onChange, onCursorLine, onHistoryChange });
  cb.current = { onChange, onCursorLine, onHistoryChange };
  const theme = useApp((s) => s.resolvedTheme);
  const [numbering, setNumbering] = useState<"element" | "line">(() => (localStorage.getItem("avas.latticeNumbering") as any) || "element");
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem("avas.latticeFont")) || 13);
  const elementIndex = useRef<Map<number, number>>(new Map());
  const numberingRef = useRef(numbering);
  numberingRef.current = numbering;
  const targetDecoration = useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
  const revealSequence = useRef(0);
  const decorations = useRef<monaco.editor.IEditorDecorationsCollection | null>(null);

  useEffect(() => {
    registerLattice(schema);
    defineThemes();
    const editor = monaco.editor.create(host.current!, {
      value: initialText,
      language: LANG,
      automaticLayout: true,
      fontFamily: '"Cascadia Mono", Consolas, "Courier New", monospace',
      fontSize,
      minimap: { enabled: false },
      wordWrap: "off",
      scrollBeyondLastLine: false,
      renderWhitespace: "none",
      readOnly: !!readOnly,
      glyphMargin: false,
      folding: true,
      showFoldingControls: "mouseover",
      lineNumbersMinChars: 3,
      tabSize: 4,
      insertSpaces: true,
      smoothScrolling: true,
      fixedOverflowWidgets: true,
      contextmenu: true,
      quickSuggestions: { other: true, comments: false, strings: false },
      suggestOnTriggerCharacters: true,
      stickyScroll: { enabled: false },
      unicodeHighlight: { ambiguousCharacters: false },
      renderLineHighlight: readOnly ? "none" : "line",
      "semanticHighlighting.enabled": false,
    } as any);
    editorRef.current = editor;
    decorations.current = editor.createDecorationsCollection();
    targetDecoration.current = editor.createDecorationsCollection();
    editor.onDidChangeModelContent((event) => {
      restoration.current.change(editor.getModel()!.getAlternativeVersionId(), event);
      if (!syncing.current) cb.current.onChange(editor.getValue());
      updateNumbers();
      // Undo/redo finish updating their stacks after the content event.
      queueMicrotask(() => {
        if (editorRef.current === editor) cb.current.onHistoryChange?.(historyState(editor.getModel()!));
      });
    });
    const selectTextLine = (line: number) => {
      revealSequence.current++;
      targetDecoration.current?.set([{ range: new monaco.Range(line, 1, line, 1), options: {
        isWholeLine: true, className: "lattice-reveal-line", linesDecorationsClassName: "lattice-reveal-margin",
      } }]);
      cb.current.onCursorLine?.(line - 1);
    };
    editor.onMouseDown((e) => {
      // The mouse target is the clicked model line; a selection's end can be on
      // the following superpose line. Also handles repeated clicks at the caret.
      if (!syncing.current && e.event.leftButton && e.target.position &&
          (e.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT ||
           e.target.type === monaco.editor.MouseTargetType.CONTENT_EMPTY ||
           e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS)) {
        selectTextLine(e.target.position.lineNumber);
      }
    });
    editor.onDidChangeCursorPosition((e) => {
      if (!syncing.current && e.source !== "api" && e.source !== "mouse" &&
          e.reason === monaco.editor.CursorChangeReason.Explicit) {
        selectTextLine(e.position.lineNumber);
      }
    });
    updateNumbers();
    cb.current.onHistoryChange?.(historyState(editor.getModel()!));
    return () => {
      editor.getModel()?.dispose();
      editor.dispose();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateNumbers() {
    const editor = editorRef.current;
    if (!editor) return;
    const map = new Map<number, number>();
    let n = -1;
    editor
      .getModel()!
      .getLinesContent()
      .forEach((raw, i) => {
        const code = raw.split("!")[0].trim();
        if (!code) return;
        const words = code.split(/\s+/);
        const kw = words.length >= 3 && words[1] === ":" ? words[2] : words[0].endsWith(":") && words.length > 1 ? words[1] : words[0];
        if (ELEMENT_KEYS.has(kw.toLowerCase())) map.set(i + 1, ++n);
      });
    elementIndex.current = map;
    if (numberingRef.current === "element") editor.updateOptions({ lineNumbers: (l: number) => (map.has(l) ? String(map.get(l)) : "") });
  }

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    localStorage.setItem("avas.latticeNumbering", numbering);
    editor.updateOptions({ lineNumbers: numbering === "line" ? "on" : (l: number) => (elementIndex.current.has(l) ? String(elementIndex.current.get(l)) : "") });
  }, [numbering]);

  useEffect(() => {
    editorRef.current?.updateOptions({ fontSize });
    localStorage.setItem("avas.latticeFont", String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly: !!readOnly, renderLineHighlight: readOnly ? "none" : "line" });
  }, [readOnly]);

  useEffect(() => {
    defineThemes();
  }, [theme]);

  // markers and greyed-out lines outside start ... end
  useEffect(() => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) return;
    setMarkers(model, doc);
    const inactive: monaco.editor.IModelDeltaDecoration[] = [];
    if (doc) {
      const end = doc.statements.find((s) => s.key === "end" && s.active);
      const start = doc.statements.find((s) => s.key === "start" && s.active);
      const lineCount = model.getLineCount();
      if (end && end.line + 2 <= lineCount)
        inactive.push({ range: new monaco.Range(end.line + 2, 1, lineCount, model.getLineMaxColumn(lineCount)), options: { inlineClassName: "lattice-inactive", isWholeLine: true } });
      if (start && start.line > 0)
        inactive.push({ range: new monaco.Range(1, 1, start.line, model.getLineMaxColumn(start.line)), options: { inlineClassName: "lattice-inactive", isWholeLine: true } });
    }
    decorations.current?.set(inactive);
  }, [doc]);

  useImperativeHandle(ref, () => ({
    getText: () => editorRef.current?.getValue() ?? "",
    getRestoration: () => restoration.current.get(),
    finishHistorySave: (origin) => restoration.current.saved(origin),
    setText: (text, resetUndo = true, revision) => {
      const editor = editorRef.current;
      if (!editor) return;
      if (!resetUndo && editor.getValue() === text) return;
      // Page-authorized replacements also work in browse mode. Isolate them in history.
      syncing.current = true;
      try {
        if (resetUndo) editor.getModel()!.setValue(text);
        else replaceModelText(editor.getModel()!, text);
      } finally {
        syncing.current = false;
      }
      if (revision) restoration.current.restored(editor.getModel()!.getAlternativeVersionId(), revision);
      updateNumbers();
    },
    applyEdits: (edits) => {
      const editor = editorRef.current;
      const model = editor?.getModel();
      if (!editor || !model || !edits.length || readOnly) return;
      const ops = edits
        .filter(([line]) => line + 1 <= model.getLineCount())
        .map(([line, text]) => ({ range: new monaco.Range(line + 1, 1, line + 1, model.getLineMaxColumn(line + 1)), text, forceMoveMarkers: true }));
      editor.pushUndoStop();
      editor.executeEdits("structure", ops);
      editor.pushUndoStop();
    },
    applyRangeEdits: (edits) => {
      const editor = editorRef.current;
      const model = editor?.getModel();
      if (!editor || !model || !edits.length || readOnly) return;
      const n = model.getLineCount();
      const ops = edits.map(({ start, end, lines }) => {
        const text = lines.join(NL);
        if (start >= n) {
          // append after the last line
          const col = model.getLineMaxColumn(n);
          return { range: new monaco.Range(n, col, n, col), text: lines.length ? NL + text : "", forceMoveMarkers: true };
        }
        if (end >= n) {
          // replace through the last line (no line break after it)
          if (!lines.length && start > 0) {
            const col = model.getLineMaxColumn(start);
            return { range: new monaco.Range(start, col, n, model.getLineMaxColumn(n)), text: "", forceMoveMarkers: true };
          }
          return { range: new monaco.Range(start + 1, 1, n, model.getLineMaxColumn(n)), text, forceMoveMarkers: true };
        }
        return { range: new monaco.Range(start + 1, 1, end + 1, 1), text: lines.length ? text + NL : "", forceMoveMarkers: true };
      });
      editor.pushUndoStop();
      editor.executeEdits("structure", ops);
      editor.pushUndoStop();
    },
    revealLine: (line0) => {
      const editor = editorRef.current;
      if (!editor) return;
      syncing.current = true;
      try {
        editor.setPosition({ lineNumber: line0 + 1, column: 1 });
        const line = line0 + 1;
        targetDecoration.current?.set([{ range: new monaco.Range(line, 1, line, 1), options: {
          isWholeLine: true, className: "lattice-reveal-line", linesDecorationsClassName: "lattice-reveal-margin",
        } }]);
        const request = ++revealSequence.current;
        // Unfold the target before scrolling; a newer click supersedes this request.
        void editor.getAction("editor.unfold")?.run().then(() => {
          if (request !== revealSequence.current || editorRef.current !== editor) return;
          editor.layout();
          editor.revealLineInCenter(line, monaco.editor.ScrollType.Immediate);
        });
        editor.revealLineInCenter(line, monaco.editor.ScrollType.Immediate);
      } finally {
        syncing.current = false;
      }
    },
    focus: () => editorRef.current?.focus(),
    undo: () => { const model = editorRef.current?.getModel(); if (model) void runHistory(model, "undo", !!readOnly); },
    redo: () => { const model = editorRef.current?.getModel(); if (model) void runHistory(model, "redo", !!readOnly); },
  }));

  const run = (id: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    editor.getAction(id)?.run();
  };

  return (
    <div className="text-editor">
      <div className="toolbar compact">
        <IconButton icon="search" tip={t("Find (Ctrl+F)")} onClick={() => run("actions.find")} />
        <IconButton icon="replace" tip={t("Replace (Ctrl+H)")} disabled={readOnly} onClick={() => run("editor.action.startFindReplaceAction")} />
        <div className="divider-v" />
        <IconButton icon="comment" tip={t("Toggle comment (Ctrl+/)")} disabled={readOnly} onClick={() => run("editor.action.commentLine")} />
        <IconButton icon="fold" tip={t("Fold all")} onClick={() => run("editor.foldAll")} />
        <IconButton icon="unfold" tip={t("Unfold all")} onClick={() => run("editor.unfoldAll")} />
        <div className="divider-v" />
        <IconButton icon="zoom-in" tip={t("Larger font")} onClick={() => setFontSize((s) => Math.min(28, s + 1))} />
        <IconButton icon="zoom-out" tip={t("Smaller font")} onClick={() => setFontSize((s) => Math.max(8, s - 1))} />
        <div className="grow" />
        <Segmented
          value={numbering}
          onChange={setNumbering}
          options={[
            { value: "element", label: "#", tip: t("Number elements (0, 1, 2 ...) like the engine does") },
            { value: "line", label: t("Line"), tip: t("Show line numbers") },
          ]}
        />
      </div>
      <div ref={host} className="monaco-host" />
    </div>
  );
});
