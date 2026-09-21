import { guessMagnet } from "./beamline3dModel";
import { fieldMapShape } from "./glyphs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLang } from "../i18n";
import { elementType, matchesStatement } from "./elementType";
import type { Keyword, Statement } from "./types";

vi.mock("./types", () => ({ elementColorVar: () => "--el-other" }));

const kw = new Map<string, Keyword>([
  ["field", { key: "field", title: ["Field map", "场图元件"], params: [{ key: "type", choices: [
    ["1", ["RF field", "高频场"]], ["2", ["static electric field", "静电场"]], ["3", ["static magnetic field", "静磁场"]],
  ] }] } as Keyword],
  ["solenoid", { key: "solenoid", title: ["Solenoid", "螺线管"] } as Keyword],
  ["quad", { key: "quad", title: ["Quadrupole", "四极铁"] } as Keyword],
]);
const field = (fieldType: string, file: string): Statement => ({
  key: "field", keyword: "field", name: "element_A", fieldType,
  params: ["0.2", "0.02", "0", fieldType, "0", "0", "0", "1", file],
} as Statement);

afterEach(() => useLang.getState().setLang("en"));

describe("element list types and search", () => {
  it("uses field type before filename hints and marks only inferred magnets", () => {
    useLang.getState().setLang("zh_CN");
    expect(elementType(field("1", "sol_map"), kw).label).toBe("射频腔");
    expect(elementType(field("2", "sol_map"), kw).label).toBe("静电场");
    expect(elementType(field("3", "sol_map"), kw).label).toBe("螺线管（推测）");
    expect(elementType(field("3", "quad_map"), kw).label).toBe("四极铁（推测）");
    expect(elementType(field("3", "unknown_map"), kw).label).toBe("静磁场");
    expect(elementType(field("3", "sol_map"), kw).inferred).toBe(true);
    expect(elementType(field("1", "sol_map"), kw).inferred).toBe(false);
    expect(elementType(field("9", "sol_map"), kw).label).toBe("场图元件");
  });

  it("searches both languages regardless of UI language and preserves existing fields", () => {
    for (const lang of ["en", "zh_CN"] as const) {
      useLang.getState().setLang(lang);
      const st = field("3", "sol_map");
      for (const query of ["螺线管", " SOLENOID ", "场图元件", "field", "element_A", "sol_map", "0.02"]) {
        expect(matchesStatement(st, kw, query)).toBe(true);
      }
      expect(matchesStatement(st, kw, "四极铁")).toBe(false);
      expect(matchesStatement(field("1", "cavity_map"), kw, "射频腔")).toBe(true);
      expect(matchesStatement({ ...st, key: "quad", keyword: "quad" }, kw, "四极铁")).toBe(true);
    }
  });

  it("keeps unknown keywords usable without schema metadata", () => {
    const st = { ...field("", ""), key: "custom", keyword: "custom" };
    expect(elementType(st, kw).label).toBe("custom");
    expect(matchesStatement(st, kw, "custom")).toBe(true);
  });
});

describe("consistent map classification across views", () => {
  it.each(["corr_map", "maps/corr_map", "q_test", "maps/q_test", "sol_map", "dip_map"])("shares classification for %s", (name) => {
    const shape = fieldMapShape(name);
    expect(guessMagnet(name)).toBe(shape === "steerer" ? "corrector" : shape);
  });
});
