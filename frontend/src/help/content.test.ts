import { describe, expect, it } from "vitest";
import { manualSections, searchManual } from "./content";
import zh from "./manual.zh.md?raw";
import en from "./manual.en.md?raw";
import cz from "./cases.zh.md?raw";
import ce from "./cases.en.md?raw";
import rz from "./reference.zh.md?raw";
import re from "./reference.en.md?raw";

describe("manual navigation", () => {
  it("does not interpret fenced input as chapters", () => {
    const sections = manualSections("# Guide {#home}\n```text\n## input comment\n```\n## Next {#next}\nbody", "guide");
    expect(sections.map(s => s.id)).toEqual(["home", "next"]);
    expect(sections[0].text).toContain("## input comment");
  });
  it("keeps translated chapter IDs stable and unique", () => {
    for (const [a,b,category] of [[zh,en,"guide"],[cz,ce,"cases"],[rz,re,"reference"]] as const) {
      const ids = manualSections(a,category).map(s=>s.id);
      expect(ids).toEqual(manualSections(b,category).map(s=>s.id));
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
  it("searches every category and every query word", () => {
    const sections = [...manualSections(zh,"guide"),...manualSections(cz,"cases"),...manualSections(rz,"reference")];
    expect(searchManual(sections,"guide","").every(s=>s.category==="guide")).toBe(true);
    const results = searchManual(sections,"guide","DataSet 41");
    expect(results.some(s=>s.id==="ref-dataset")).toBe(true);
    expect(searchManual(sections,"guide","no-such-manual-word")).toEqual([]);
  });
});
