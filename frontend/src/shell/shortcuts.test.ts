import { describe, expect, it } from "vitest";
import { keyMatches, SHORTCUT, SHORTCUTS } from "./shortcuts";

const ev = (key: string, mods: Partial<Pick<KeyboardEvent, "ctrlKey" | "metaKey" | "shiftKey" | "altKey">> = {}) =>
  ({ key, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...mods }) as KeyboardEvent;

describe("keyMatches", () => {
  it("matches modifiers exactly", () => {
    expect(keyMatches(ev("s", { ctrlKey: true }), "Ctrl+S")).toBe(true);
    expect(keyMatches(ev("S", { ctrlKey: true, shiftKey: true }), "Ctrl+S")).toBe(false);
    expect(keyMatches(ev("s"), "Ctrl+S")).toBe(false);
    expect(keyMatches(ev("s", { metaKey: true }), "Ctrl+S")).toBe(true);
    expect(keyMatches(ev("A", { ctrlKey: true, shiftKey: true }), "Ctrl+Shift+A")).toBe(true);
    expect(keyMatches(ev("a", { ctrlKey: true }), "Ctrl+Shift+A")).toBe(false);
  });
  it("handles function keys and the zoom keys", () => {
    expect(keyMatches(ev("F5"), "F5")).toBe(true);
    expect(keyMatches(ev("F5", { shiftKey: true }), "F5")).toBe(false);
    expect(keyMatches(ev("F5", { shiftKey: true }), "Shift+F5")).toBe(true);
    expect(keyMatches(ev("=", { ctrlKey: true }), "Ctrl+=")).toBe(true);
    expect(keyMatches(ev("+", { ctrlKey: true, shiftKey: true }), "Ctrl+=")).toBe(true);
    expect(keyMatches(ev("-", { ctrlKey: true }), "Ctrl+-")).toBe(true);
  });
});

describe("SHORTCUTS", () => {
  it("has unique ids and keys", () => {
    expect(new Set(SHORTCUTS.map((s) => s.id)).size).toBe(SHORTCUTS.length);
    expect(new Set(SHORTCUTS.map((s) => s.keys)).size).toBe(SHORTCUTS.length);
    expect(SHORTCUT.save.keys).toBe("Ctrl+S");
  });
});
