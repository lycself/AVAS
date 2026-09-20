import type { GroupNode, LatticeDoc } from "./types";

/** Ancestors only, excluding the invisible document root. */
export function selectedGroups(doc: LatticeDoc, line: number): string[] {
  const walk = (node: GroupNode): string[] | null => {
    for (const child of node.children) {
      if ("s" in child) {
        if (doc.statements[child.s]?.line === line) return [];
      } else {
        const path = walk(child);
        if (path !== null) return [`${child.kind}:${child.line}`, ...path];
      }
    }
    return null;
  };
  return walk(doc.root) ?? [];
}
