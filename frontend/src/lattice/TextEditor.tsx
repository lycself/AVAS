// Monaco-based text editor for lattice files.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { IconButton, Segmented } from "../components/ui";
import { useT } from "../i18n";
import { useApp } from "../store/app";
import { defineThemes, LANG, monaco, registerLattice, setMarkers } from "./monaco";
import type { Edit, LatticeDoc, Schema } from "./types";

export type TextEditorHandle = {
  getText: () => string;
  /** Replace the whole text; clears undo history when *resetUndo*. */
  setText: (text: string, resetUndo?: boolean) => void;
  /** Whole-line replacements as one undo step. */
  applyEdits: (edits: Edit[]) => void;
  revealLine: (line0: number) => void;
  focus: () => void;
};

type Props = {
  schema: Schema;
  initialText: string;
  readOnly?: boolean;
  doc: LatticeDoc | null;
  onChange: (text: string) => void;
  onCursorLine?: (line0: number) => void;
};

const ELEMENT_KEYS = new Set(["drift", "field", "quad", "solenoid", "bend", "steerer", "edge", "diag_energy", "diag_size", "diag_position"]);

export const TextEditor = forwardRef<TextEditorHandle, Props>(function TextEditor({ schema, initialText, readOnly, doc, onChange, onCursorLine }, ref) {
  const t = useT();
  const host = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const syncing = useRef(false);
  const cb = useRef({ onChange, onCursorLine });
  cb.current = { onChange, onCursorLine };
  const theme = useApp((s) => s.resolvedTheme);
  const [numbering, setNumbering] = useState<"element" | "line">(() => (localStorage.getItem("avas.latticeNumbering") as any) || "element");
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem("avas.latticeFont")) || 13);
  const elementIndex = useRef<Map<number, number>>(new Map());
  const numberingRef = useRef(numbering);
  numberingRef.current = numbering;
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
    editor.onDidChangeModelContent(() => {
      if (!syncing.current) cb.current.onChange(editor.getValue());
      updateNumbers();
    });
    editor.onDidChangeCursorPosition((e) => {
      if (!syncing.current && e.source !== "api") cb.current.onCursorLine?.(e.position.lineNumber - 1);
    });
    updateNumbers();
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
    setText: (text, resetUndo = true) => {
      const editor = editorRef.current;
      if (!editor) return;
      syncing.current = true;
      try {
        if (resetUndo) editor.getModel()!.setValue(text);
        else editor.executeEdits("avas", [{ range: editor.getModel()!.getFullModelRange(), text }]);
      } finally {
        syncing.current = false;
      }
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
    revealLine: (line0) => {
      const editor = editorRef.current;
      if (!editor) return;
      syncing.current = true;
      try {
        editor.setPosition({ lineNumber: line0 + 1, column: 1 });
        editor.revealLineInCenterIfOutsideViewport(line0 + 1);
      } finally {
        syncing.current = false;
      }
    },
    focus: () => editorRef.current?.focus(),
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
