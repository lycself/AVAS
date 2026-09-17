// Small Markdown renderer for assistant answers.  It builds React elements
// (no HTML injection), handles text that is still streaming in, and covers
// what models write: headings, paragraphs, lists, tables, code blocks,
// quotes, rules, inline code, bold / italic, links and $math$ (shown as code).
import type { ReactNode } from "react";
import { call } from "../bridge";

type Block =
  | { t: "code"; lang: string; text: string }
  | { t: "heading"; level: number; text: string }
  | { t: "para"; text: string }
  | { t: "list"; ordered: boolean; items: string[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "quote"; text: string }
  | { t: "rule" };

const FENCE = /^\s*(```|~~~)\s*([\w+-]*)\s*$/;
const HEADING = /^\s{0,3}(#{1,6})\s+(.*)$/;
const BULLET = /^\s{0,3}[-*+]\s+(.*)$/;
const ORDERED = /^\s{0,3}\d+[.)]\s+(.*)$/;
const RULE = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

export function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(FENCE);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].match(FENCE)) body.push(lines[i++]);
      i++;
      blocks.push({ t: "code", lang: fence[2] ?? "", text: body.join("\n") });
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const h = line.match(HEADING);
    if (h) {
      blocks.push({ t: "heading", level: h[1].length, text: h[2].replace(/#+\s*$/, "") });
      i++;
      continue;
    }
    if (RULE.test(line)) {
      blocks.push({ t: "rule" });
      i++;
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      const head = splitRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(splitRow(lines[i++]));
      blocks.push({ t: "table", head, rows });
      continue;
    }
    if (BULLET.test(line) || ORDERED.test(line)) {
      const ordered = !BULLET.test(line);
      const items: string[] = [];
      while (i < lines.length) {
        const m = lines[i].match(ordered ? ORDERED : BULLET);
        if (m) {
          items.push(m[1]);
          i++;
        } else if (lines[i].trim() && /^\s{2,}/.test(lines[i]) && items.length) {
          items[items.length - 1] += "\n" + lines[i].trim();
          i++;
        } else break;
      }
      blocks.push({ t: "list", ordered, items });
      continue;
    }
    if (/^\s{0,3}>/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && /^\s{0,3}>/.test(lines[i])) body.push(lines[i++].replace(/^\s{0,3}>\s?/, ""));
      blocks.push({ t: "quote", text: body.join("\n") });
      continue;
    }
    const body: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !FENCE.test(lines[i]) &&
      !HEADING.test(lines[i]) &&
      !BULLET.test(lines[i]) &&
      !ORDERED.test(lines[i]) &&
      !RULE.test(lines[i]) &&
      !(lines[i].includes("|") && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1]))
    )
      body.push(lines[i++]);
    blocks.push({ t: "para", text: body.join("\n") });
  }
  return blocks;
}

const INLINE = /(`+)([\s\S]*?)\1|\$\$([^$]+)\$\$|\$([^$\n]+)\$|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\n]+)\*|(?<![\w])_([^_\n]+)_(?![\w])|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

export function inline(text: string, keyPrefix = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(INLINE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(...withBreaks(text.slice(last, idx), `${keyPrefix}t${k}`));
    const key = `${keyPrefix}${k++}`;
    if (m[1]) out.push(<code key={key}>{m[2]}</code>);
    else if (m[3] || m[4]) out.push(<code key={key} className="md-math">{m[3] ?? m[4]}</code>);
    else if (m[5] || m[6]) out.push(<strong key={key}>{inline(m[5] ?? m[6], key)}</strong>);
    else if (m[7] || m[8]) out.push(<em key={key}>{inline(m[7] ?? m[8], key)}</em>);
    else if (m[9]) {
      const url = m[10];
      out.push(
        <a key={key} onClick={() => call("shell.openUrl", { url }).catch(() => undefined)} data-tip={url}>
          {m[9]}
        </a>,
      );
    }
    last = idx + m[0].length;
  }
  if (last < text.length) out.push(...withBreaks(text.slice(last), `${keyPrefix}e`));
  return out;
}

function withBreaks(text: string, key: string): ReactNode[] {
  const parts = text.split("\n");
  return parts.flatMap((p, i) => (i ? [<br key={`${key}b${i}`} />, p] : [p]));
}

export function Markdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return (
    <div className="md selectable">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "code":
            return (
              <pre key={i} className="md-code">
                {b.lang && <span className="md-lang">{b.lang}</span>}
                <code>{b.text}</code>
              </pre>
            );
          case "heading": {
            const Tag = (`h${Math.min(6, b.level + 2)}` as unknown) as "h3";
            return <Tag key={i}>{inline(b.text, `h${i}`)}</Tag>;
          }
          case "list":
            return b.ordered ? (
              <ol key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it, `l${i}-${j}`)}</li>
                ))}
              </ol>
            ) : (
              <ul key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it, `l${i}-${j}`)}</li>
                ))}
              </ul>
            );
          case "table":
            return (
              <div key={i} className="md-table-wrap">
                <table className="md-table">
                  <thead>
                    <tr>
                      {b.head.map((c, j) => (
                        <th key={j}>{inline(c, `th${i}-${j}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, n) => (
                          <td key={n}>{inline(c, `td${i}-${j}-${n}`)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "quote":
            return (
              <blockquote key={i}>
                <Markdown text={b.text} />
              </blockquote>
            );
          case "rule":
            return <hr key={i} />;
          default:
            return <p key={i}>{inline(b.text, `p${i}`)}</p>;
        }
      })}
    </div>
  );
}

