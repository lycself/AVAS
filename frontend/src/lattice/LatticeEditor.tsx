// Text editor and structure editor (or the visual editor) on one lattice text.
// The Monaco model is the single source of truth: every structured or visual
// edit is applied to it as one undo step, then re-parsed.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { call } from "../bridge";
import { choiceDialog, reportError } from "../components/overlays";
import { Spinner } from "../components/ui";
import { t } from "../i18n";
import { setVisualEditing, useLatticeUi } from "../store/latticeUi";
import { setFieldmapNames } from "./monaco";
import { StructureEditor } from "./StructureEditor";
import type { RangeEdit } from "./structureOps";
import { TextEditor, type TextEditorHandle } from "./TextEditor";
import { loadSchema, type Edit, type LatticeDoc, type Schema } from "./types";
import { VisualEditor } from "./VisualEditor";

export type LatticeEditorHandle = {
  getText: () => string;
  setText: (text: string) => void;
  /** Whole-line replacements as one undo step (used by the assistant). */
  applyEdits: (edits: Edit[]) => void;
  applyRangeEdits: (edits: RangeEdit[], select?: number) => void;
  /** Replace the whole text as one undoable edit (assistant changes). */
  replaceText: (text: string) => void;
  select: (line: number) => void;
  selection: () => { line: number; keyword: string; name: string } | null;
};

type Props = {
  initialText: string;
  readOnly?: boolean;
  fieldDirs?: string[];
  onChange?: (text: string) => void;
  /** Layout: side by side (lattice page), the visual editor, or structure only with the text in a tab. */
  layout?: "split" | "visual" | "structure" | "text";
  /** Unsaved changes on the page, and how to save them (for "Done" in the visual editor). */
  dirty?: boolean;
  onSave?: () => Promise<void>;
  /** False when the shown file is not the lattice used for the run: the visual editor hides run results. */
  runResults?: boolean;
};

export const LatticeEditor = forwardRef<LatticeEditorHandle, Props>(function LatticeEditor({ initialText, readOnly, fieldDirs, onChange, layout = "split", dirty, onSave, runResults }, ref) {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [doc, setDoc] = useState<LatticeDoc | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [fieldmaps, setFieldmaps] = useState<Record<string, string[]>>({});
  const [split, setSplit] = useState(() => Number(localStorage.getItem("avas.latticeSplit")) || 0.4);
  const [showText, setShowText] = useState(() => localStorage.getItem("avas.visual.text") === "1");
  const textRef = useRef<TextEditorHandle>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const seq = useRef(0);
  const docRef = useRef<LatticeDoc | null>(null);
  docRef.current = doc;
  const pendingSelect = useRef<number | null>(null);
  const selectedRef = useRef<number | null>(null);
  selectedRef.current = selected;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const editing = useLatticeUi((s) => s.visualEditing);
  const editBase = useRef<string | null>(null);

  useEffect(() => {
    loadSchema().then(setSchema);
  }, []);

  // the browse state returns when the visual editor is left or a run locks the inputs
  useEffect(() => {
    if (layout === "visual" && readOnly) setVisualEditing(false);
    if (layout === "split") setVisualEditing(false);
  }, [layout, readOnly]);

  const dirsKey = JSON.stringify(fieldDirs ?? null);
  useEffect(() => {
    call<Record<string, string[]>>("lattice.fieldmaps", { fieldDirs: fieldDirs ?? null })
      .then((m) => {
        setFieldmaps(m);
        setFieldmapNames(Object.keys(m));
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirsKey]);

  const parse = useCallback(
    (text: string, delay: number) => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        const my = ++seq.current;
        call<LatticeDoc>("lattice.parse", { text, fieldDirs: fieldDirs ?? null })
          .then((d) => {
            if (my !== seq.current) return;
            setDoc(d);
            const want = pendingSelect.current;
            if (want != null && d.statements.some((s) => s.line === want)) {
              pendingSelect.current = null;
              setSelected(want);
              textRef.current?.revealLine(want);
            }
          })
          .catch(() => undefined);
      }, delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dirsKey],
  );

  useEffect(() => {
    parse(initialText, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirsKey]);

  const applyEdits = useCallback(
    (edits: Edit[]) => {
      textRef.current?.applyEdits(edits);
      if (textRef.current) parse(textRef.current.getText(), 0);
    },
    [parse],
  );

  const applyRangeEdits = useCallback(
    (edits: RangeEdit[], select?: number) => {
      if (!textRef.current || readOnly) return;
      textRef.current.applyRangeEdits(edits);
      if (select != null) pendingSelect.current = select;
      parse(textRef.current.getText(), 0);
    },
    [parse, readOnly],
  );

  const selectLine = useCallback((line: number) => {
    const d = docRef.current;
    if (d && d.statements.some((s) => s.line === line)) {
      setSelected(line);
      textRef.current?.revealLine(line);
    } else pendingSelect.current = line;
  }, []);

  // selection requested from elsewhere (overview, assistant)
  const pending = useLatticeUi((s) => s.pendingSelect);
  useEffect(() => {
    if (pending) selectLine(pending.line);
  }, [pending, selectLine]);

  useImperativeHandle(ref, () => ({
    getText: () => textRef.current?.getText() ?? initialText,
    setText: (text) => {
      textRef.current?.setText(text, true);
      parse(text, 0);
    },
    applyEdits,
    applyRangeEdits,
    replaceText: (text) => {
      if (!textRef.current) return;
      textRef.current.setText(text, false);
      onChangeRef.current?.(text);
      parse(text, 0);
    },
    select: selectLine,
    selection: () => {
      const d = docRef.current;
      const st = d && selectedRef.current != null ? d.statements.find((s) => s.line === selectedRef.current) : null;
      return st ? { line: st.line, keyword: st.keyword, name: st.name } : null;
    },
  }));

  if (!schema) return <div className="empty-state"><Spinner size={24} /></div>;

  const select = (line: number, source: string) => {
    setSelected(line);
    if (source !== "text") textRef.current?.revealLine(line);
  };

  const startDrag = (e: React.MouseEvent) => {
    const el = hostRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    e.preventDefault();
    document.body.classList.add("dragging");
    let last = split;
    const textOnRight = layout === "visual";
    const move = (ev: MouseEvent) => {
      const pos = (ev.clientX - r.left) / r.width;
      last = Math.min(0.75, Math.max(0.2, textOnRight ? 1 - pos : pos));
      setSplit(last);
    };
    const up = () => {
      document.body.classList.remove("dragging");
      localStorage.setItem("avas.latticeSplit", String(last));
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const getLines = () => (textRef.current?.getText() ?? initialText).split(/\r?\n/);
  const getText = () => textRef.current?.getText() ?? initialText;
  // the visual editor (and the text shown next to it) change the lattice only in its edit state
  const visualReadOnly = !!readOnly || !editing;

  const startEditing = () => {
    if (readOnly) return;
    editBase.current = getText();
    setVisualEditing(true);
  };

  const finishEditing = async () => {
    if (!dirty) {
      setVisualEditing(false);
      return;
    }
    const choice = await choiceDialog(
      t("The lattice has unsaved changes."),
      [
        { key: "save", label: t("Save"), variant: "primary" },
        { key: "discard", label: t("Discard this editing session") },
        { key: "keep", label: t("Keep editing") },
      ],
      { title: t("Finish editing") },
    );
    if (choice === "save") {
      try {
        await onSave?.();
        setVisualEditing(false);
      } catch (e) {
        reportError(e);
      }
    } else if (choice === "discard") {
      const base = editBase.current;
      if (base != null && textRef.current && base !== getText()) {
        textRef.current.setText(base, false); // one undoable step
        onChangeRef.current?.(base);
        parse(base, 0);
      }
      setVisualEditing(false);
    }
  };

  const text = (
    <TextEditor
      ref={textRef}
      schema={schema}
      initialText={initialText}
      readOnly={layout === "visual" ? visualReadOnly : readOnly}
      doc={doc}
      onChange={(t) => {
        onChangeRef.current?.(t);
        parse(t, 350);
      }}
      onCursorLine={(line) => {
        const d = docRef.current;
        if (d && d.statements.some((s) => s.line === line)) setSelected(line);
      }}
    />
  );

  if (layout === "visual" || layout === "split") {
    // Keyed children: switching between the two layouts moves the text pane instead of
    // remounting it, so the Monaco model (unsaved text, undo history) survives.
    const visual = layout === "visual";
    const toggleText = () => {
      setShowText((v) => {
        localStorage.setItem("avas.visual.text", v ? "0" : "1");
        return !v;
      });
    };
    const textPane = (
      <div
        key="text"
        className={visual ? "pane ve-text" : "pane"}
        style={visual ? { width: showText ? `${Math.min(split, 0.5) * 100}%` : 0, display: showText ? "flex" : "none" } : { width: `${split * 100}%` }}
      >
        {text}
      </div>
    );
    const sash = <div key="sash" className="sash sash-v" style={visual && !showText ? { display: "none" } : undefined} onMouseDown={startDrag} />;
    const main = (
      <div key="main" className="pane grow">
        {visual ? (
          <VisualEditor
            doc={doc}
            schema={schema}
            selected={selected}
            onSelect={select}
            onEdits={applyEdits}
            onRangeEdits={applyRangeEdits}
            getText={getText}
            fieldDirs={fieldDirs ?? null}
            fieldmaps={fieldmaps}
            readOnly={visualReadOnly}
            editState={readOnly ? "locked" : editing ? "edit" : "browse"}
            dirty={!!dirty}
            onStartEdit={startEditing}
            onFinishEdit={finishEditing}
            onSave={onSave}
            runResults={runResults}
            showText={showText}
            onToggleText={toggleText}
            onUndo={() => textRef.current?.undo()}
            onRedo={() => textRef.current?.redo()}
          />
        ) : (
          <StructureEditor
            doc={doc}
            schema={schema}
            selected={selected}
            readOnly={readOnly}
            fieldmaps={fieldmaps}
            onSelect={select}
            onEdits={applyEdits}
            onRangeEdits={applyRangeEdits}
            getLines={getLines}
          />
        )}
      </div>
    );
    return (
      <div className={visual ? "lattice-editor split visual" : "lattice-editor split"} ref={hostRef}>
        {visual ? [main, sash, textPane] : [textPane, sash, main]}
      </div>
    );
  }

  const structure = (
    <StructureEditor
      doc={doc}
      schema={schema}
      selected={selected}
      readOnly={readOnly}
      fieldmaps={fieldmaps}
      onSelect={select}
      onEdits={applyEdits}
      onRangeEdits={applyRangeEdits}
      getLines={getLines}
    />
  );

  // tabbed hosts keep both mounted so the text model (and undo) survives tab switches
  return (
    <div className="lattice-editor stacked" ref={hostRef}>
      <div className="pane grow" style={{ display: layout === "structure" ? "flex" : "none" }}>
        {structure}
      </div>
      <div className="pane grow" style={{ display: layout === "text" ? "flex" : "none" }}>
        {text}
      </div>
    </div>
  );
});
