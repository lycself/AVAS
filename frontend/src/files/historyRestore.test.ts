import { describe, expect, it, vi } from "vitest";
import { restoreHistoryVersion } from "./historyRestore";

describe("restoring file history", () => {
  it("preserves the unsaved editor snapshot before applying a version", async () => {
    const apply = vi.fn();
    const prepare = vi.fn(async (text: string) => {
      expect(text).toBe("unsaved edit");
      expect(apply).not.toHaveBeenCalled();
      return { text: "old version" };
    });
    expect(await restoreHistoryVersion({ getText: () => "unsaved edit", available: () => true, prepare, apply })).toBe("restored");
    expect(apply).toHaveBeenCalledExactlyOnceWith("old version");
  });

  it("refuses restoration if a run starts, the file changes, or the dialog closes while waiting", async () => {
    let available = true;
    const apply = vi.fn();
    expect(await restoreHistoryVersion({ getText: () => "draft", available: () => available,
      prepare: async () => { available = false; return { text: "old" }; }, apply })).toBe("unavailable");
    expect(apply).not.toHaveBeenCalled();
  });

  it("does not overwrite changes made while the backup request was pending", async () => {
    let text = "draft";
    const apply = vi.fn();
    expect(await restoreHistoryVersion({ getText: () => text, available: () => true,
      prepare: async () => { text = "newer edit"; return { text: "old" }; }, apply })).toBe("changed");
    expect(apply).not.toHaveBeenCalled();
  });

  it("does not apply when backing up the current text fails", async () => {
    const apply = vi.fn();
    await expect(restoreHistoryVersion({ getText: () => "draft", available: () => true,
      prepare: async () => { throw new Error("disk full"); }, apply })).rejects.toThrow("disk full");
    expect(apply).not.toHaveBeenCalled();
  });
});
