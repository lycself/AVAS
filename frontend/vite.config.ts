import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// The built page is shipped inside the Python package (avas/gui/web) and
// served by avas.gui.server, so asset URLs must be relative.
export default defineConfig({
  base: "./",
  plugins: [react()],
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
});
