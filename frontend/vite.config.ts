import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The built page is shipped inside the Python package (avas/webgui/web) and
// served by avas.webgui.server, so asset URLs must be relative.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "../avas/webgui/web",
    emptyOutDir: true,
    target: "es2022",
    chunkSizeWarningLimit: 8000,
    sourcemap: false,
  },
  worker: { format: "es" },
  server: { port: 5173, strictPort: true },
});
