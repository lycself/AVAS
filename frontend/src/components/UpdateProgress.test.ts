import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { UpdateProgress } from "./UpdateProgress";

describe("update download display", () => {
  it("shows size, percentage and speed for a known length", () => {
    const html = renderToStaticMarkup(createElement(UpdateProgress, { data: { stage: "download", message: "Downloading the update...", downloaded: 1024, total: 4096, speed: 512 } }));
    expect(html).toContain("25%");
    expect(html).toContain("1.0 KB / 4.0 KB");
    expect(html).toContain("512 B/s");
    expect(html).toContain('aria-valuenow="25"');
  });
  it("does not invent a percentage when the server omits the length", () => {
    const html = renderToStaticMarkup(createElement(UpdateProgress, { data: { stage: "download", message: "Downloading the update...", downloaded: 1024, total: null, speed: 512 } }));
    expect(html).toContain("Unknown size");
    expect(html).toContain("indeterminate");
    expect(html).not.toContain("aria-valuenow");
  });
  it("does not show stale transfer figures while verifying", () => {
    const html = renderToStaticMarkup(createElement(UpdateProgress, { data: { stage: "verify", message: "Verifying the update checksum..." } }));
    expect(html).toContain("Verifying the update checksum...");
    expect(html).not.toContain("Average download speed");
    expect(html).not.toContain("100%");
  });
});
