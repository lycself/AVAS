// The operations are pure functions of a parsed document and the text lines; the
// document normally comes from lattice.parse (Python), here a tiny parser builds
// the parts of it the operations look at.
import { describe, expect, it } from "vitest";
import {
  deleteUnit,
  superposeWith,
  dropMarker,
  duplicateUnit,
  insertAfter,
  insertAtZ,
  moveUnit,
  moveUnitTo,
  newElementText,
  topUnits,
  type OpResult,
  type RangeEdit,
} from "./structureOps";
import type { LatticeDoc, Statement } from "./types";

const ELEMENTS = new Set(["drift", "quad", "solenoid", "bend", "field", "steerer", "edge"]);
const LENGTH_KEYS = new Set(["drift", "quad", "solenoid", "field"]);

/** Enough of lattice.parse for the tests: z accumulates along top-level elements, superpose blocks nest. */
function parse(text: string[]): LatticeDoc {
  const statements: Statement[] = [];
  let z = 0;
  let block: number | null = null;
  let blockSeq = 0;
  let blockZ0 = 0;
  let blockEnd = 0;
  let pendingZ0 = 0;
  text.forEach((raw, line) => {
    const m = raw.match(/^(\s*)(?:([^\s!:]+)\s*:\s*)?(\S+)\s*(.*)$/);
    if (!m || raw.trim() === "" || raw.trim().startsWith("!")) return;
    const [, indent, prefixName = "", keyword, rest] = m;
    const params = rest.trim() ? rest.trim().split(/\s+/) : [];
    const key = keyword.toLowerCase();
    const isElement = ELEMENTS.has(key);
    const length = isElement && LENGTH_KEYS.has(key) ? Number(params[0]) || 0 : 0;
    if (key === "superpose" && block === null) {
      block = blockSeq++;
      blockZ0 = z;
      blockEnd = z;
    }
    let zStart: number | null = null;
    let zEnd: number | null = null;
    if (key === "superpose") pendingZ0 = Number(params[0]) || 0;
    if (isElement) {
      if (block !== null) {
        zStart = blockZ0 + pendingZ0;
        zEnd = zStart + length;
        blockEnd = Math.max(blockEnd, zEnd);
      } else {
        zStart = z;
        zEnd = z + length;
        z = zEnd;
      }
    } else if (key !== "superposeend") zStart = zEnd = block !== null ? blockZ0 : z;
    statements.push({
      line,
      raw,
      indent,
      keyword,
      key,
      name: prefixName,
      prefixName,
      commentName: "",
      commentNameLine: null,
      params,
      comment: "",
      active: true,
      zStart,
      zEnd,
      length,
      block,
      category: isElement ? "element" : "command",
      isElement,
      known: true,
      fieldType: key === "field" ? params[3] ?? "" : "",
      issues: [],
    });
    if (key === "superposeend") {
      z = blockEnd;
      block = null;
    }
  });
  return { statements, root: { title: "", kind: "root", line: null, children: [] }, issues: [], totalLength: z, elementCount: 0, rfCount: 0, issueCount: 0 };
}

/** Apply range edits the way TextEditor does: all against the original line numbers. */
function apply(text: string[], edits: RangeEdit[]): string[] {
  const out = [...text];
  for (const e of [...edits].sort((a, b) => b.start - a.start)) out.splice(e.start, e.end - e.start, ...e.lines);
  return out;
}

function ok(r: OpResult): Exclude<OpResult, { error: string }> {
  if ("error" in r) throw new Error(r.error);
  return r;
}

const SIMPLE = ["start", "drift 0.3 0.02 0", "Q1 : quad 0.1 0.02 0 5", "drift 0.5 0.02 0", "end"];

const BLOCK = [
  "start",
  "drift 0.3 0.02 0",
  "superpose 0 0 0 0 0 0",
  "quad 0.1 0.02 0 5",
  "superpose 0.05 0 0 0 0 0",
  "solenoid 0.2 0.02 0 1",
  "superposeend",
  "drift 0.1 0.02 0",
  "end",
];

describe("parse fixture", () => {
  it("accumulates z", () => {
    const doc = parse(SIMPLE);
    expect(doc.statements.map((s) => s.zStart)).toEqual([0, 0, 0.3, 0.4, 0.9]);
    expect(doc.totalLength).toBeCloseTo(0.9);
    const b = parse(BLOCK);
    expect(b.statements.find((s) => s.key === "solenoid")!.zStart).toBeCloseTo(0.35);
    expect(b.statements.find((s) => s.line === 7)!.zStart).toBeCloseTo(0.55);
  });
});

describe("topUnits", () => {
  it("treats a superpose block as one unit", () => {
    const units = topUnits(parse(BLOCK));
    expect(units.map((u) => [u.start, u.end, u.kind])).toEqual([
      [0, 1, "statement"],
      [1, 2, "statement"],
      [2, 7, "block"],
      [7, 8, "statement"],
      [8, 9, "statement"],
    ]);
  });
});

describe("insertAfter", () => {
  it("inserts on the next line with the same indentation", () => {
    const doc = parse(["start", "  drift 0.3 0.02 0", "end"]);
    const r = ok(insertAfter(doc, [], 1, "quad 0.1 0.02 0 0"));
    expect(r.edits).toEqual([{ start: 2, end: 2, lines: ["  quad 0.1 0.02 0 0"] }]);
    expect(r.select).toBe(2);
  });
  it("after a block element goes after the whole block", () => {
    const doc = parse(BLOCK);
    const r = ok(insertAfter(doc, BLOCK, 3, "drift 0.1 0.02 0"));
    expect(r.edits[0].start).toBe(7);
  });
  it("after 'end' inserts before it", () => {
    const doc = parse(SIMPLE);
    const r = ok(insertAfter(doc, SIMPLE, 4, "drift 0.1 0.02 0"));
    expect(r.edits).toEqual([{ start: 4, end: 4, lines: ["drift 0.1 0.02 0"] }]);
  });
});

describe("duplicateUnit", () => {
  it("copies the line after itself and renames a named element", () => {
    const doc = parse(SIMPLE);
    const r = ok(duplicateUnit(doc, SIMPLE, 2));
    expect(apply(SIMPLE, r.edits)).toEqual(["start", "drift 0.3 0.02 0", "Q1 : quad 0.1 0.02 0 5", "Q1_copy : quad 0.1 0.02 0 5", "drift 0.5 0.02 0", "end"]);
    expect(r.select).toBe(3);
  });
  it("copies a block element together with its superpose line", () => {
    const doc = parse(BLOCK);
    const r = ok(duplicateUnit(doc, BLOCK, 3));
    expect(r.edits).toEqual([{ start: 4, end: 4, lines: ["superpose 0 0 0 0 0 0", "quad 0.1 0.02 0 5"] }]);
  });
  it("refuses fixed lines", () => {
    expect(duplicateUnit(parse(SIMPLE), SIMPLE, 0)).toHaveProperty("error");
  });
});

describe("moveUnit", () => {
  it("moves down past the next unit and keeps the selection on the moved line", () => {
    const doc = parse(SIMPLE);
    const r = ok(moveUnit(doc, SIMPLE, 1, 1));
    expect(apply(SIMPLE, r.edits)).toEqual(["start", "Q1 : quad 0.1 0.02 0 5", "drift 0.3 0.02 0", "drift 0.5 0.02 0", "end"]);
    expect(r.select).toBe(2);
  });
  it("moves up", () => {
    const doc = parse(SIMPLE);
    const r = ok(moveUnit(doc, SIMPLE, 3, -1));
    expect(apply(SIMPLE, r.edits)).toEqual(["start", "drift 0.3 0.02 0", "drift 0.5 0.02 0", "Q1 : quad 0.1 0.02 0 5", "end"]);
    expect(r.select).toBe(2);
  });
  it("moves a whole block", () => {
    const doc = parse(BLOCK);
    const r = ok(moveUnit(doc, BLOCK, 5, 1));
    const out = apply(BLOCK, r.edits);
    expect(out.slice(1, 8)).toEqual(["drift 0.3 0.02 0", "drift 0.1 0.02 0", "superpose 0 0 0 0 0 0", "quad 0.1 0.02 0 5", "superpose 0.05 0 0 0 0 0", "solenoid 0.2 0.02 0 1", "superposeend"]);
    expect(out[r.select!]).toBe("solenoid 0.2 0.02 0 1");
  });
  it("stops at start and end", () => {
    const doc = parse(SIMPLE);
    expect(moveUnit(doc, SIMPLE, 1, -1)).toHaveProperty("error");
    expect(moveUnit(doc, SIMPLE, 3, 1)).toHaveProperty("error");
    expect(moveUnit(doc, SIMPLE, 0, 1)).toHaveProperty("error");
  });
});

describe("moveUnitTo", () => {
  it("drops a unit after another one", () => {
    const doc = parse(SIMPLE);
    const r = ok(moveUnitTo(doc, SIMPLE, 1, 3, true));
    expect(apply(SIMPLE, r.edits)).toEqual(["start", "Q1 : quad 0.1 0.02 0 5", "drift 0.5 0.02 0", "drift 0.3 0.02 0", "end"]);
    expect(r.select).toBe(3);
  });
  it("drops a unit before another one", () => {
    const doc = parse(SIMPLE);
    const r = ok(moveUnitTo(doc, SIMPLE, 3, 1, false));
    expect(apply(SIMPLE, r.edits)).toEqual(["start", "drift 0.5 0.02 0", "drift 0.3 0.02 0", "Q1 : quad 0.1 0.02 0 5", "end"]);
    expect(r.select).toBe(1);
  });
  it("is a no-op on itself and refuses the outside of start/end", () => {
    const doc = parse(SIMPLE);
    expect(ok(moveUnitTo(doc, SIMPLE, 1, 1, true)).edits).toEqual([]);
    expect(moveUnitTo(doc, SIMPLE, 1, 4, true)).toHaveProperty("error");
    expect(moveUnitTo(doc, SIMPLE, 1, 0, false)).toHaveProperty("error");
  });
});

describe("deleteUnit", () => {
  it("deletes one line", () => {
    const doc = parse(SIMPLE);
    const r = ok(deleteUnit(doc, SIMPLE, 2));
    expect(apply(SIMPLE, r.edits)).toEqual(["start", "drift 0.3 0.02 0", "drift 0.5 0.02 0", "end"]);
  });
  it("deletes a later block element with its superpose line", () => {
    const doc = parse(BLOCK);
    const r = ok(deleteUnit(doc, BLOCK, 5));
    expect(apply(BLOCK, r.edits)).toEqual(["start", "drift 0.3 0.02 0", "superpose 0 0 0 0 0 0", "quad 0.1 0.02 0 5", "superposeend", "drift 0.1 0.02 0", "end"]);
  });
  it("deleting the first block element re-references z0 and keeps positions with a drift", () => {
    const doc = parse(BLOCK);
    const r = ok(deleteUnit(doc, BLOCK, 3));
    expect(apply(BLOCK, r.edits)).toEqual(["start", "drift 0.3 0.02 0", "drift 0.05 0.02 0", "superpose 0 0 0 0 0 0", "solenoid 0.2 0.02 0 1", "superposeend", "drift 0.1 0.02 0", "end"]);
    expect(r.message).toContain("0.05");
  });
  it("deleting a superpose keyword line removes the whole block", () => {
    const doc = parse(BLOCK);
    const r = ok(deleteUnit(doc, BLOCK, 6));
    expect(r.edits).toEqual([{ start: 2, end: 7, lines: [] }]);
  });
  it("refuses fixed lines", () => {
    expect(deleteUnit(parse(SIMPLE), SIMPLE, 4)).toHaveProperty("error");
  });
});

describe("insertAtZ", () => {
  it("splits a drift so downstream positions do not move", () => {
    const text = ["start", "drift 0.5 0.02 0", "end"];
    const doc = parse(text);
    const r = ok(insertAtZ(doc, text, 0.2, "quad 0.1 0.02 0 0", 0.1));
    expect(apply(text, r.edits)).toEqual(["start", "drift 0.2 0.02 0", "quad 0.1 0.02 0 0", "drift 0.2 0.02 0", "end"]);
    expect(r.select).toBe(2);
    expect(r.message).toMatch(/Split the drift/);
  });
  it("uses the whole drift when the element fills it", () => {
    const text = ["start", "drift 0.5 0.02 0", "end"];
    const r = ok(insertAtZ(parse(text), text, 0, "quad 0.5 0.02 0 0", 0.5));
    expect(apply(text, r.edits)).toEqual(["start", "quad 0.5 0.02 0 0", "end"]);
  });
  it("inserts after a drift that is too short", () => {
    const text = ["start", "drift 0.1 0.02 0", "end"];
    const r = ok(insertAtZ(parse(text), text, 0.05, "quad 0.5 0.02 0 0", 0.5));
    expect(apply(text, r.edits)).toEqual(["start", "drift 0.1 0.02 0", "quad 0.5 0.02 0 0", "end"]);
    expect(r.message).toMatch(/shorter/);
  });
  it("creates a block at the drop position and preserves the original element", () => {
    const r = ok(insertAtZ(parse(SIMPLE), SIMPLE, 0.32, "solenoid 0.02 0.02 0 1", 0.02));
    const out = apply(SIMPLE, r.edits);
    expect(out.slice(2, 7)).toEqual(["superpose 0 0 0 0 0 0", SIMPLE[2], "superpose 0.02 0 0 0 0 0", "solenoid 0.02 0.02 0 1", "superposeend"]);
    const doc = parse(out);
    expect(doc.statements.find((s) => s.key === "solenoid")?.zStart).toBeCloseTo(0.32);
    expect(doc.totalLength).toBeCloseTo(parse(SIMPLE).totalLength);
    expect(out[r.select!]).toBe("solenoid 0.02 0.02 0 1");
  });
  it("keeps endpoint insertion sequential", () => {
    const text = ["start", "quad 0.1 0.02 0 1", "end"];
    expect(apply(text, ok(insertAtZ(parse(text), text, 0.1, "solenoid 0.1 0.02 0 1", 0.1)).edits)).toEqual([text[0], text[1], "solenoid 0.1 0.02 0 1", "end"]);
  });
  it("superposes inside a block", () => {
    const doc = parse(BLOCK);
    const r = ok(insertAtZ(doc, BLOCK, 0.4, "steerer 0 0.02 0 0 0 0 0", 0));
    expect(r.edits).toEqual([{ start: 6, end: 6, lines: ["superpose 0.1 0 0 0 0 0", "steerer 0 0.02 0 0 0 0 0"] }]);
  });
  it("beyond the last element appends after it", () => {
    const doc = parse(SIMPLE);
    const r = ok(insertAtZ(doc, SIMPLE, 5, "drift 0.1 0.02 0", 0.1));
    expect(r.edits[0].start).toBe(4);
  });
});

describe("dropMarker", () => {
  it("names what a drop would do", () => {
    const doc = parse(BLOCK);
    expect(dropMarker(doc, 0.1).kind).toBe("split");
    expect(dropMarker(doc, 0.4).kind).toBe("superpose");
    expect(dropMarker(parse(SIMPLE), 0.32)).toEqual({ z: 0.32, kind: "superpose" });
    expect(dropMarker(parse(SIMPLE), 5).kind).toBe("between");
  });
});

describe("newElementText", () => {
  it("writes plain numbers", () => {
    expect(newElementText("drift")).toBe("drift 0.1 0.02 0");
    expect(newElementText("quad", { length: 0.25, aperture: 0.015 })).toBe("quad 0.25 0.015 0 0");
    expect(newElementText("field_rf", { frequency: 162.5e6, fieldmap: "hwr" })).toBe("field 0.2 0.02 0 1 162500000 0 1 1 hwr");
    expect(newElementText("outputplane")).toBe("outputplane 0");
  });
});

describe("aligned superposition", () => {
  it("creates three members at exactly the same start and keeps downstream positions", () => {
    const text = ["start", "drift 0.2 0.02 0", "S : field 0.35 0.02 0 3 0 0 1 1 sol", "drift 0.1 0.02 0", "end"];
    const two = apply(text, ok(superposeWith(parse(text), text, 2, "H : field 0.35 0.02 0 3 0 0 1 1 v3h")).edits);
    const doc = parse(two);
    const three = apply(two, ok(superposeWith(doc, two, doc.statements.find((s) => s.name === "H")!.line, "V : field 0.35 0.02 0 3 0 0 1 1 v3v")).edits);
    const result = parse(three);
    const members = result.statements.filter((s) => s.key === "field");
    expect(members).toHaveLength(3);
    expect(members.map((s) => s.zStart)).toEqual([0.2, 0.2, 0.2]);
    expect(new Set(members.map((s) => s.block)).size).toBe(1);
    expect(result.totalLength).toBeCloseTo(parse(text).totalLength);
    expect(three.filter((s) => s === "superposeend")).toHaveLength(1);
  });
  it("supports a zero length target and preserves its original text", () => {
    const text = ["start", "C : steerer 0 0.02 0 1 0 0 0", "end"];
    const result = ok(superposeWith(parse(text), text, 1, "quad 0.1 0.02 0 1"));
    expect(apply(text, result.edits)).toContain(text[1]);
    expect(result.edits).toHaveLength(1);
    expect("error" in superposeWith(parse(text), text, 0, "quad 0.1 0.02 0 1")).toBe(true);
  });
});
