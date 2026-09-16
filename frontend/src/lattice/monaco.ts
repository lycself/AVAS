// Monaco set-up for AVAS lattice files: language, colours, folding,
// completion and hover help from the keyword schema.
import * as monaco from "./monacoCore";
import EditorWorker from "monaco-esm/editor/editor.worker.js?worker";
import { isZh, pick } from "../i18n";
import { choiceLabel, type Keyword, type LatticeDoc, type Schema } from "./types";

export { monaco };
export const LANG = "avas-lattice";

(self as any).MonacoEnvironment = { getWorker: () => new EditorWorker() };

const MAGNETS = ["quad", "solenoid", "bend", "steerer", "edge"];
const BOUNDS = ["start", "end"];

let registered = false;
let schemaRef: Schema | null = null;
let fieldmapNames: string[] = [];

export function setFieldmapNames(names: string[]) {
  fieldmapNames = names;
}

function kwMap(): Map<string, Keyword> {
  return new Map((schemaRef?.lattice ?? []).map((k) => [k.key, k]));
}

/** A colour token as 6-digit hex without "#" (the CSS minifier shortens #cccccc to #ccc). */
function css(name: string) {
  let v = getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace("#", "");
  if (/^[0-9a-f]{3}$/i.test(v)) v = v.split("").map((c) => c + c).join("");
  return /^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v) ? v : "808080";
}

export function defineThemes() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  const name = dark ? "avas-dark" : "avas-light";
  monaco.editor.defineTheme(name, {
    base: dark ? "vs-dark" : "vs",
    inherit: true,
    rules: [
      { token: "keyword.field", foreground: css("--syn-field") },
      { token: "keyword.magnet", foreground: css("--syn-magnet") },
      { token: "keyword.bound", foreground: css("--syn-bound"), fontStyle: "bold" },
      { token: "keyword.drift", foreground: css("--syn-default") },
      { token: "keyword.command", foreground: dark ? "c586c0" : "af00db" },
      { token: "keyword.unknown", foreground: css("--warning") },
      { token: "keyword.fold", foreground: css("--syn-fold"), fontStyle: "bold" },
      { token: "comment", foreground: dark ? "6a9955" : "008000", fontStyle: "italic" },
      { token: "comment.heading", foreground: dark ? "6a9955" : "008000", fontStyle: "bold" },
      { token: "comment.name", foreground: dark ? "9cdcfe" : "001080" },
      { token: "type.name", foreground: dark ? "9cdcfe" : "001080" },
      { token: "number", foreground: dark ? "b5cea8" : "098658" },
      { token: "string.file", foreground: dark ? "ce9178" : "a31515" },
    ],
    colors: {
      "editor.background": "#" + css("--editor-bg"),
      "editor.foreground": "#" + css("--fg"),
      "editorLineNumber.foreground": "#" + css("--gutter-fg"),
      "editorLineNumber.activeForeground": "#" + css("--fg-strong"),
      "editor.lineHighlightBackground": "#" + css("--current-line"),
      "editor.lineHighlightBorder": "#00000000",
      "editorWidget.background": "#" + css("--tooltip-bg"),
      "editorWidget.border": "#" + css("--tooltip-border"),
      "editorGutter.background": "#" + css("--editor-bg"),
      "scrollbarSlider.background": dark ? "#79797966" : "#64646466",
    },
  });
  monaco.editor.setTheme(name);
}

const KEYWORD_CASES = {
  cases: {
    "@field": "keyword.field",
    "@drift": "keyword.drift",
    "@magnets": "keyword.magnet",
    "@bounds": "keyword.bound",
    "@commands": "keyword.command",
    "@default": "keyword.unknown",
  },
};

export function registerLattice(schema: Schema) {
  schemaRef = schema;
  if (registered) return;
  registered = true;
  monaco.languages.register({ id: LANG, extensions: [".txt"], aliases: ["AVAS lattice"] });
  const commands = schema.lattice.map((k) => k.key).filter((k) => k !== "field" && k !== "drift" && !MAGNETS.includes(k) && !BOUNDS.includes(k));
  monaco.languages.setMonarchTokensProvider(LANG, {
    ignoreCase: true,
    field: ["field"],
    drift: ["drift"],
    magnets: MAGNETS,
    bounds: BOUNDS,
    commands,
    tokenizer: {
      root: [
        [/^\s*!\s*name\b.*$/, "comment.name"],
        [/^\s*![\s;:.\-=_*~#/|+]{3,}.*$/, "comment.heading"],
        [/!.*$/, "comment"],
        [/^\s*section\b/, "keyword.fold"],
        [/^(\s*)([\w.\-]+)(\s*:\s+)([A-Za-z_]\w*)/, ["", "type.name", "delimiter", KEYWORD_CASES]],
        [/^(\s*)([A-Za-z_]\w*)/, ["", KEYWORD_CASES]],
        [/[{}]/, "keyword.fold"],
        [/[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?(?![\w.])/, "number"],
        [/[^\s!]+/, "string.file"],
      ],
    },
  } as any);
  monaco.languages.setLanguageConfiguration(LANG, {
    comments: { lineComment: "!" },
    brackets: [["{", "}"]],
    wordPattern: /[A-Za-z_][\w.\-]*|[-+]?\d*\.?\d+([eE][-+]?\d+)?/,
  });

  monaco.languages.registerFoldingRangeProvider(LANG, {
    provideFoldingRanges(model) {
      const ranges: monaco.languages.FoldingRange[] = [];
      const stack: { kind: string; line: number }[] = [];
      const lines = model.getLinesContent();
      let heading: number | null = null;
      lines.forEach((raw, i) => {
        const line = i + 1;
        const s = raw.trim();
        const low = s.split("!")[0].trim().toLowerCase();
        const words = low.split(/\s+/);
        const kw = words.length >= 3 && words[1] === ":" ? words[2] : words[0]?.endsWith(":") && words.length > 1 ? words[1] : words[0];
        if (/^![\s;:.\-=_*~#/|+]{3,}\S/.test(s) && !stack.length) {
          if (heading !== null && line - 1 > heading) ranges.push({ start: heading, end: line - 1, kind: monaco.languages.FoldingRangeKind.Region });
          heading = line;
        }
        if (/^section\b/.test(low)) stack.push({ kind: "section", line });
        else if (low === "}" ) {
          const top = stack.length ? stack[stack.length - 1] : null;
          if (top?.kind === "section") {
            stack.pop();
            if (line > top.line) ranges.push({ start: top.line, end: line, kind: monaco.languages.FoldingRangeKind.Region });
          }
        } else if (kw === "lattice") stack.push({ kind: "lattice", line });
        else if (kw === "lattice_end") {
          const idx = stack.map((x) => x.kind).lastIndexOf("lattice");
          if (idx >= 0) {
            const top = stack.splice(idx, 1)[0];
            ranges.push({ start: top.line, end: line });
          }
        } else if (kw === "superpose" && !stack.some((x) => x.kind === "superpose")) stack.push({ kind: "superpose", line });
        else if (kw === "superposeend" || kw === "superposeout") {
          const idx = stack.map((x) => x.kind).lastIndexOf("superpose");
          if (idx >= 0) {
            const top = stack.splice(idx, 1)[0];
            ranges.push({ start: top.line, end: line });
          }
        }
      });
      if (heading !== null && lines.length > heading) {
        let end = lines.length;
        while (end > heading && !lines[end - 1].trim()) end--;
        if (end > heading) ranges.push({ start: heading, end, kind: monaco.languages.FoldingRangeKind.Region });
      }
      return ranges;
    },
  });

  monaco.languages.registerCompletionItemProvider(LANG, {
    triggerCharacters: [" "],
    provideCompletionItems(model, position) {
      const lineText = model.getLineContent(position.lineNumber);
      const before = lineText.slice(0, position.column - 1);
      if (before.includes("!")) return { suggestions: [] };
      const word = model.getWordUntilPosition(position);
      const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
      let tokens = before.trim().split(/\s+/).filter(Boolean);
      if (tokens.length >= 2 && tokens[1] === ":") tokens = tokens.slice(2);
      else if (tokens[0]?.endsWith(":")) tokens = tokens.slice(1);
      const typing = /\S$/.test(before);
      const index = typing ? tokens.length - 1 : tokens.length; // 0 = keyword position
      const map = kwMap();
      if (index <= 0) {
        return {
          suggestions: (schemaRef?.lattice ?? []).map((k, i) => {
            const snippet = [k.key, ...k.params.slice(0, k.minParams).map((p, j) => `\${${j + 1}:${p.kind === "reserved" ? "0" : p.key}}`)].join(" ");
            return {
              label: { label: k.key, description: pick(k.title) },
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: snippet,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: { value: keywordDoc(k) },
              range,
              sortText: String(i).padStart(3, "0"),
            };
          }),
        };
      }
      const kw = map.get(tokens[0]?.toLowerCase());
      const p = kw?.params[index - 1];
      if (!p) return { suggestions: [] };
      if (p.kind === "fieldmap") {
        return {
          suggestions: fieldmapNames.map((n) => ({ label: n, kind: monaco.languages.CompletionItemKind.File, insertText: n, range, detail: pick(p.label) })),
        };
      }
      if (p.choices.length) {
        return {
          suggestions: p.choices.map(([v, text]) => ({
            label: { label: v, description: pick(text) },
            kind: monaco.languages.CompletionItemKind.EnumMember,
            insertText: v,
            range,
          })),
        };
      }
      return { suggestions: [] };
    },
  });

  monaco.languages.registerHoverProvider(LANG, {
    provideHover(model, position) {
      const lineText = model.getLineContent(position.lineNumber);
      const code = lineText.split("!")[0];
      if (position.column - 1 > code.length) return null;
      const re = /\S+/g;
      const tokens: { text: string; start: number; end: number }[] = [];
      let m: RegExpExecArray | null;
      while ((m = re.exec(code))) tokens.push({ text: m[0], start: m.index + 1, end: m.index + 1 + m[0].length });
      let offset = 0;
      if (tokens.length >= 3 && tokens[1].text === ":") offset = 2;
      else if (tokens[0]?.text.endsWith(":") && tokens.length > 1) offset = 1;
      const kwTok = tokens[offset];
      if (!kwTok) return null;
      const kw = kwMap().get(kwTok.text.toLowerCase());
      if (!kw) return null;
      const hit = tokens.findIndex((tk) => position.column >= tk.start && position.column <= tk.end);
      if (hit < offset) return null;
      const range = new monaco.Range(position.lineNumber, tokens[hit].start, position.lineNumber, tokens[hit].end);
      if (hit === offset) return { range, contents: [{ value: keywordDoc(kw) }] };
      const p = kw.params[hit - offset - 1];
      if (!p) return { range, contents: [{ value: isZh() ? "手册未说明的参数" : "parameter not described in the manual" }] };
      const label = choiceLabel(p, tokens[hit].text);
      const lines = [`**${pick(p.label)}**${p.unit ? ` (${p.unit})` : ""}`];
      if (pick(p.doc)) lines.push(pick(p.doc));
      if (label) lines.push(`\`${tokens[hit].text}\` = ${pick(label)}`);
      return { range, contents: [{ value: lines.join("\n\n") }] };
    },
  });
}

function keywordDoc(k: Keyword): string {
  const head = `**${k.key}** — ${pick(k.title)}`;
  const doc = pick(k.doc);
  const params = k.params.map((p, i) => `${i + 1}. ${pick(p.label)}${p.unit ? ` (${p.unit})` : ""}`).join("\n");
  return [head, doc, params].filter(Boolean).join("\n\n");
}

/** Problems of the parsed document as editor markers. */
export function setMarkers(model: monaco.editor.ITextModel, doc: LatticeDoc | null) {
  if (!doc) {
    monaco.editor.setModelMarkers(model, "avas", []);
    return;
  }
  const markers: monaco.editor.IMarkerData[] = [];
  for (const st of doc.statements) {
    for (const issue of st.issues) {
      const line = st.line + 1;
      if (line > model.getLineCount()) continue;
      markers.push({
        severity: issue.level === "error" ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
        message: pick(issue.text),
        startLineNumber: line,
        startColumn: model.getLineFirstNonWhitespaceColumn(line) || 1,
        endLineNumber: line,
        endColumn: model.getLineMaxColumn(line),
      });
    }
  }
  monaco.editor.setModelMarkers(model, "avas", markers);
}
