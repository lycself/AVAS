/** Recheck the target and editor after the asynchronous snapshot request. */
export async function restoreHistoryVersion(options: {
  getText: () => string;
  available: () => boolean;
  prepare: (currentText: string) => Promise<{ text: string }>;
  apply: (text: string) => void;
}): Promise<"restored" | "changed" | "unavailable"> {
  if (!options.available()) return "unavailable";
  const before = options.getText();
  const result = await options.prepare(before);
  if (!options.available()) return "unavailable";
  if (options.getText() !== before) return "changed";
  options.apply(result.text);
  return "restored";
}
