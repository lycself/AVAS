export type ManualCategory = "guide" | "cases" | "reference";
export type ManualSection = { id: string; title: string; text: string; category: ManualCategory };

/** Only top-level chapter headings outside fences split documents. Explicit IDs survive translation. */
export function manualSections(source: string, category: ManualCategory): ManualSection[] {
  const result: ManualSection[] = [];
  let fence = "";
  let current: ManualSection | undefined;
  for (const line of source.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = "";
    }
    const heading = !fence && line.match(/^#{1,2} (.+?)(?: \{#([\w-]+)\})?\s*$/);
    if (heading) {
      current = { id: heading[2] || `${category}-${result.length}`, title: heading[1], text: "", category };
      result.push(current);
    } else if (current) current.text += line + "\n";
  }
  return result;
}

/** A nonempty search spans every category, while browsing stays within the selected category. */
export function searchManual(sections: ManualSection[], category: ManualCategory, query: string) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return sections.filter(s => words.length
    ? words.every(word => `${s.title}\n${s.text}`.toLocaleLowerCase().includes(word))
    : s.category === category);
}
