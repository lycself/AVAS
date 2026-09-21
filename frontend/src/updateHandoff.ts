/** Capture the visible update panel as bounded drawing primitives, never HTML.
 * The dependency-free installer keeps these positions, including wrapped notes.
 */
type Rect = [number, number, number, number];
type Command = [string, Rect, string, ...Array<string | number | number[]>];
export function captureUpdatePanel(panel: HTMLElement) {
  const origin = panel.getBoundingClientRect();
  const zoom = Number(getComputedStyle(document.documentElement).zoom) || 1;
  const rect = (r: DOMRect): Rect => [r.left - origin.left, r.top - origin.top, r.right - origin.left, r.bottom - origin.top];
  const bounds = (selector: string) => {
    const element = panel.querySelector(selector);
    return element ? rect(element.getBoundingClientRect()) : null;
  };
  const ink = (element: Element) => {
    const channels = getComputedStyle(element).color.match(/[\d.]+/g);
    return channels ? `#${channels.slice(0, 3).map(v => Math.round(Number(v)).toString(16).padStart(2, "0")).join("")}` : "#000000"; // design:allow-colour serialized computed colour fallback
  };
  const body = panel.querySelector<HTMLElement>(".update-body")!;
  const clip = body.getBoundingClientRect();
  const commands: Command[] = [];
  const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node && commands.length < 2000; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || parent.closest("button, .codicon, .update-steps, .update-progress, .float-resize")) continue;
    const style = getComputedStyle(parent);
    if (style.visibility === "hidden" || !parent.getClientRects().length) continue;
    const content = node.textContent ?? "";
    const range = document.createRange();
    let line = "", advances: number[] = [], lineRect: DOMRect | null = null;
    const flush = () => {
      if (lineRect && line.trim()) commands.push(["text", rect(lineRect), ink(parent), line, parseFloat(style.fontSize) * zoom, "left", Number(style.fontWeight) || 400, advances]);
      line = ""; advances = []; lineRect = null;
    };
    for (let i = 0; i < Math.min(content.length, 16000);) {
      const char = String.fromCodePoint(content.codePointAt(i)!);
      range.setStart(node, i); range.setEnd(node, i + char.length);
      i += char.length;
      const r = range.getBoundingClientRect();
      if (body.contains(parent) && (r.bottom <= clip.top || r.top >= clip.bottom || r.left >= clip.right)) { flush(); continue; }
      if (lineRect && Math.abs(r.top - lineRect.top) > 1) flush();
      line += char;
      advances.push(r.width, ...Array<number>(char.length - 1).fill(0));
      lineRect = lineRect ? new DOMRect(lineRect.x, lineRect.y, r.right - lineRect.x, Math.max(lineRect.height, r.height)) : r;
    }
    flush();
  }
  const arrow = panel.querySelector(".codicon-arrow-right");
  if (arrow) commands.push(["text", rect(arrow.getBoundingClientRect()), ink(arrow), "→", 16 * zoom, "left", 400, [16 * zoom]]);
  return { width: origin.width, height: origin.height, commands,
    header: bounds(".float-title"), body: bounds(".update-body"), footer: bounds(".update-footer"),
    message: bounds(".update-progress-label"), track: bounds(".progress"),
    nodes: Array.from(panel.querySelectorAll(".update-node"), e => rect(e.getBoundingClientRect())),
    labels: Array.from(panel.querySelectorAll(".update-steps li > span:last-child"), e => rect(e.getBoundingClientRect())),
    title: bounds(".update-hero h2"),
    grid: 40 * zoom, scroll: body.scrollTop * zoom,
    rules: [bounds(".update-notes"), bounds(".update-footer")].filter((r): r is Rect => r !== null).map(r => [r[0], r[1], r[2], r[1] + zoom]),
  };
}
