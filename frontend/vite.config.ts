import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { commentationPlugin } from "./vite-plugin-commentation";

/**
 * Default: dev server + demo page (index.html loads /src/embed.tsx as module).
 * Commentation plugin serves /__commentation__/api and writes to .commentation/.
 * For the distributable, run: pnpm build && use vite.embed.config.
 */
export default defineConfig({
  plugins: [react(), commentationPlugin()],
  root: ".",
  publicDir: "public",
  server: { port: 5173 },
});
