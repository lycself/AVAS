import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PlayerBar } from "./PlayerBar";

const player = vi.hoisted(() => ({ replay: null as null | { id: string; label: string; kind: string; playing: boolean; progress: number; speed: number; timeMode: string; tau: null } }));
vi.mock("./bunchPlayer", () => ({
  usePlayer: (select: (s: typeof player) => unknown) => select(player),
  REPLAY_SPEEDS: [1], setReplay: vi.fn(), startReplay: vi.fn(), stopReplay: vi.fn(),
}));
afterEach(() => { player.replay = null; });
const render = () => renderToStaticMarkup(createElement(PlayerBar, { id: "lastrun:local", label: "last run", track: null, compact: true, followKinds: ["project", "segment"] }));

describe("replay controls across pages", () => {
  it("controls a record started elsewhere even without local last-run data", () => {
    player.replay = { id: "record:archive", label: "archived run", kind: "project", playing: true, progress: 0.4, speed: 1, timeMode: "z", tau: null };
    const html = render();
    expect(html).toContain("Pause replay");
    expect(html).toContain("End replay");
    expect(html).toContain("archived run");
    expect(html).toContain('value="400"');
    player.replay.playing = false;
    expect(render()).toContain("Continue replay");
    player.replay = null;
    expect(render()).not.toContain("End replay");
  });

  it("also controls segment replay but does not expose assistant replay on the lattice page", () => {
    player.replay = { id: "record:segment", label: "segment", kind: "segment", playing: false, progress: 0.2, speed: 1, timeMode: "z", tau: null };
    expect(render()).toContain("Continue replay");
    player.replay.kind = "assistant";
    expect(render()).not.toContain("End replay");
    expect(render()).not.toContain("Continue replay");
  });
});
