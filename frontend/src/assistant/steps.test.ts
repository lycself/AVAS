import { describe, expect, it } from "vitest";
import { layoutItems } from "./steps";
import type { Item } from "./store";

const user = (id: string): Item => ({ id, role: "user", text: "q" });
const assistant = (id: string, text = "", reasoning = ""): Item => ({ id, role: "assistant", text, reasoning });
const tool = (id: string, extra: Partial<Item> = {}): Item => ({ id, role: "tool", name: "primer_read", status: "done", ...extra });

describe("assistant layout", () => {
  it("folds thinking, notes and quick tool calls before the answer into one block", () => {
    const out = layoutItems([user("u"), assistant("a1", "", "plan"), tool("t1"), assistant("a2", "let me read more"), tool("t2"), assistant("a3", "answer", "why")]);
    expect(out.map((e) => e.kind)).toEqual(["item", "steps", "item"]);
    const steps = out[1].kind === "steps" ? out[1].steps : [];
    expect(steps.map((s) => s.kind)).toEqual(["thinking", "tool", "note", "tool", "thinking"]);
    expect(out[2]).toMatchObject({ kind: "item", hideThinking: true, item: { id: "a3" } });
  });

  it("keeps proposals and tool calls with results outside the block", () => {
    const out = layoutItems([
      user("u"),
      tool("t1"),
      tool("t2", { name: "scan_parameter", table: { rows: [{ a: 1 }] } }),
      tool("t3"),
      { id: "p", role: "proposal" },
      assistant("a", "done"),
    ]);
    expect(out.map((e) => (e.kind === "steps" ? `steps:${e.steps.length}` : e.item.id))).toEqual(["u", "steps:1", "t2", "steps:1", "p", "a"]);
  });

  it("treats every turn on its own", () => {
    const out = layoutItems([user("u1"), tool("t1"), assistant("a1", "one"), user("u2"), assistant("a2", "two")]);
    expect(out.map((e) => (e.kind === "steps" ? "steps" : e.item.id))).toEqual(["u1", "steps", "a1", "u2", "a2"]);
  });

  it("while a turn is still running the steps so far form the last block", () => {
    const out = layoutItems([user("u"), assistant("a1", "", "thinking…"), tool("t1", { status: "running" })]);
    expect(out[out.length - 1]).toMatchObject({ kind: "steps" });
  });
});
