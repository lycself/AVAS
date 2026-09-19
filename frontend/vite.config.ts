import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));

/** SHA-256 of the front-end sources; must match source_hash() in tests/test_design_rules.py. */
function sourceHash(): string {
  const files: string[] = [];
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else files.push(path);
    }
  };
  walk(join(here, "src"));
  walk(join(here, "public"));
  for (const name of ["index.html", "vite.config.ts", "tsconfig.json", "package.json"]) if (existsSync(join(here, name))) files.push(join(here, name));
  const rels = files.map((p) => relative(here, p).split(sep).join("/")).sort();
  const h = createHash("sha256");
  for (const rel of rels) {
    const data = Buffer.from(readFileSync(join(here, rel)).toString("latin1").replace(/\r\n/g, "\n"), "latin1");
    h.update(`${rel}\0${createHash("sha256").update(data).digest("hex")}\n`);
  }
  return h.digest("hex");
}

/** Writes web/source-hash.json so a test can tell a stale committed build. */
function sourceStamp(outDir: string): Plugin {
  return {
    name: "avas-source-stamp",
    apply: "build",
    closeBundle() {
      writeFileSync(join(outDir, "source-hash.json"), JSON.stringify({ sha256: sourceHash() }, null, 2) + "\n");
    },
  };
}

const outDir = fileURLToPath(new URL("../avas/gui/web", import.meta.url));

// The built page is shipped inside the Python package (avas/gui/web) and
// served by avas.gui.server, so asset URLs must be relative.
export default defineConfig({
  base: "./",
  plugins: [react(), sourceStamp(outDir)],
  resolve: {
    alias: [{ find: /^monaco-esm\//, replacement: fileURLToPath(new URL("./node_modules/monaco-editor/esm/vs/", import.meta.url)) }],
  },
  build: {
    outDir: "../avas/gui/web",
    emptyOutDir: true,
    target: "es2022",
    chunkSizeWarningLimit: 8000,
    sourcemap: false,
  },
  worker: { format: "es" },
  server: { port: 5173, strictPort: true },
  // unit tests (npm test): pure modules only, no DOM
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
