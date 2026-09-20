import { expect, it } from "vitest";
import { createRestorationTracker } from "./restorationOrigin";

it("keeps nested restorations and a new restoration during a pending save separate", () => {
  const tracker = createRestorationTracker();
  tracker.change(1, {});
  tracker.restored(2, "a");
  const saved = tracker.get();
  tracker.restored(3, "b");
  tracker.saved(saved);
  expect(tracker.get()?.revision).toBe("b");
  tracker.change(2, { isUndoing: true });
  expect(tracker.get()).toBeNull();
  tracker.change(3, { isRedoing: true });
  expect(tracker.get()?.revision).toBe("b");
  tracker.change(4, { isFlush: true });
  expect(tracker.get()).toBeNull();
});

it("does not attach restoration to an ordinary edit after undo", () => {
  const tracker = createRestorationTracker();
  tracker.change(1, {});
  tracker.restored(2, "a");
  tracker.change(1, { isUndoing: true });
  tracker.change(3, {});
  expect(tracker.get()).toBeNull();
});
