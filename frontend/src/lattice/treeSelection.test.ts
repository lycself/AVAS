import { describe, expect, it } from "vitest";
import { selectedGroups } from "./treeSelection";
import type { GroupNode, LatticeDoc, Statement } from "./types";

const group = (kind: string, line: number | null, children: GroupNode["children"]): GroupNode => ({ kind, line, children, title: kind });
const doc = {
  statements: [10, 124, 140, 200].map((line) => ({ line } as Statement)),
  root: group("root", null, [
    { s: 0 },
    group("heading", 20, [group("period", 30, [group("superpose", 120, [{ s: 1 }, { s: 2 }])])]),
    group("superpose", 190, [{ s: 3 }]),
  ]),
} as LatticeDoc;

describe("revealing a diagram selection in the outline", () => {
  it("opens every ancestor of a nested element, without opening unrelated groups", () => {
    expect(selectedGroups(doc, 124)).toEqual(["heading:20", "period:30", "superpose:120"]);
    expect(selectedGroups(doc, 140)).toEqual(["heading:20", "period:30", "superpose:120"]);
    expect(selectedGroups(doc, 200)).toEqual(["superpose:190"]);
  });
  it("uses source line numbers instead of statement indices and handles missing selection", () => {
    expect(selectedGroups(doc, 1)).toEqual([]);
    expect(selectedGroups(doc, 10)).toEqual([]);
    expect(selectedGroups(doc, 999)).toEqual([]);
  });
});
