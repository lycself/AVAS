// Text editor and structure editor side by side on one lattice text.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { call } from "../bridge";
import { Spinner } from "../components/ui";
import { setFieldmapNames } from "./monaco";
import { StructureEditor } from "./StructureEditor";
import { TextEditor, type TextEditorHandle } from "./TextEditor";
import { loadSchema, type LatticeDoc, type Schema } from "./types";

export type LatticeEditorHandle = {
  getText: () => string;
  setText: (text: string) => void;
};

type Props = {
  initialText: string;
  readOnly?: boolean;
  fieldDirs?: string[];
  onChange?: (text: string) => void;
  /** Layout: side by side (lattice page) or structure only with the text in a tab. */
  layout?: "split" | "structure" | "text";
};

export const LatticeEditor = forwardRef<LatticeEditorHandle, Props>(function LatticeEditor({ initialText, readOnly, fieldDirs, onChange, layout = "split" }, ref) {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [doc, setDoc] = useState<LatticeDoc | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [fieldmaps, setFieldmaps] = useState<Record<string, string[]>>({});
  const [split, setSplit] = useState(() => Number(localStorage.getItem("avas.latticeSplit")) || 0.4);
  const textRef = useRef<TextEditorHandle>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const seq = useRef(0);
  const docRef = useRef<LatticeDoc | null>(null);
  docRef.current = doc;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    loadSchema().then(setSchema);
  }, []);

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
            if (my === seq.current) setDoc(d);
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

  useImperativeHandle(ref, () => ({
    getText: () => textRef.current?.getText() ?? initialText,
    setText: (text) => {
      textRef.current?.setText(text, true);
      parse(text, 0);
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
    const move = (ev: MouseEvent) => {
      last = Math.min(0.75, Math.max(0.2, (ev.clientX - r.left) / r.width));
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

  const text = (
    <TextEditor
      ref={textRef}
      schema={schema}
      initialText={initialText}
      readOnly={readOnly}
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
  const structure = (
    <StructureEditor doc={doc} schema={schema} selected={selected} readOnly={readOnly} fieldmaps={fieldmaps} onSelect={select} onEdits={(edits) => textRef.current?.applyEdits(edits)} />
  );

  if (layout === "split") {
    return (
      <div className="lattice-editor split" ref={hostRef}>
        <div className="pane" style={{ width: `${split * 100}%` }}>
          {text}
        </div>
        <div className="sash sash-v" onMouseDown={startDrag} />
        <div className="pane grow">{structure}</div>
      </div>
    );
  }
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
