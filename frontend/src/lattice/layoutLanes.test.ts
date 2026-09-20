import { describe, expect, it } from "vitest";
import { assignLanes, laneAt, laneCenter, superposeGroups } from "./layoutLanes";

describe("schematic overlap lanes", () => {
  it("keeps every coincident element separately selectable, with no four-lane cap", () => {
    const items = assignLanes(Array.from({ length: 7 }, (_, line) => ({ line, z0: 1, z1: 2 })));
    expect(new Set(items.map((i) => i.lane)).size).toBe(7);
    for (const item of items) {
      expect(items.filter((i) => i.lane === laneAt(laneCenter(item.lane))).map((i) => i.line)).toEqual([item.line]);
      expect([item.z0, item.z1]).toEqual([1, 2]);
    }
  });

  it("separates partial overlaps and reuses a lane at an adjacent boundary", () => {
    const input = [{ z0: 1, z1: 3 }, { z0: 0, z1: 2 }, { z0: 2, z1: 4 }, { z0: 4, z1: 5 }];
    const items = assignLanes(input);
    expect(items.map((i) => i.lane)).toEqual([1, 0, 0, 0]);
    expect(items.map(({ z0, z1 }) => ({ z0, z1 }))).toEqual(input);
  });

  it("gives coincident zero-length markers their own lanes", () => {
    const items = assignLanes([{ z0: 0, z1: 2 }, { z0: 1, z1: 1 }, { z0: 1, z1: 1 }]);
    expect(items.map((i) => i.lane)).toEqual([0, 1, 2]);
  });

  it("retains distinct superpose brackets regardless of display lane reuse", () => {
    const items = assignLanes([
      { z0: 0, z1: 2, block: 0 }, { z0: 1, z1: 3, block: 0 },
      { z0: 3, z1: 4, block: null }, { z0: 4, z1: 6, block: 1 },
    ]);
    expect(superposeGroups(items)).toEqual([{ z0: 0, z1: 3 }, { z0: 4, z1: 6 }]);
  });
});
