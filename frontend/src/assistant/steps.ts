// How a conversation is laid out: the model's thinking, its intermediate notes
// and its quick tool calls before an answer are folded into one "Thinking"
// block, so the answer is not buried under a stack of tool cards.  Proposals
// (they wait for the user), notices, errors and tool calls that carry their own
// results (progress, charts, tables) stay visible on their own.
import type { Item } from "./store";

export type Step = { kind: "thinking" | "note"; id: string; text: string } | { kind: "tool"; id: string; item: Item };

export type Entry = { kind: "item"; item: Item; hideThinking?: boolean } | { kind: "steps"; key: string; steps: Step[] };

/** A tool call whose result the user should see without opening anything. */
export function showsResult(item: Item): boolean {
  return !!(item.charts?.length || item.table?.rows?.length || item.best || item.progress);
}

export function layoutItems(items: Item[]): Entry[] {
  const out: Entry[] = [];
  let steps: Step[] = [];
  const flush = () => {
    if (steps.length) out.push({ kind: "steps", key: steps[0].id, steps });
    steps = [];
  };
  // the answer of a turn is its last assistant message with text; earlier ones are notes on the way
  const answers = new Set<Item>();
  let last: Item | null = null;
  for (const item of items) {
    if (item.role === "user") {
      if (last) answers.add(last);
      last = null;
    } else if (item.role === "assistant" && item.text?.trim()) last = item;
  }
  if (last) answers.add(last);

  for (const item of items) {
    switch (item.role) {
      case "assistant": {
        if (item.reasoning?.trim()) steps.push({ kind: "thinking", id: `${item.id}:r`, text: item.reasoning });
        if (answers.has(item)) {
          flush();
          out.push({ kind: "item", item, hideThinking: true });
        } else if (item.text?.trim()) steps.push({ kind: "note", id: item.id, text: item.text });
        break;
      }
      case "tool":
        if (showsResult(item)) {
          flush();
          out.push({ kind: "item", item });
        } else steps.push({ kind: "tool", id: item.id, item });
        break;
      default:
        flush();
        out.push({ kind: "item", item });
    }
  }
  flush();
  return out;
}
