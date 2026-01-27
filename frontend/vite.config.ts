import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

/**
 * Default: dev server + demo page (index.html loads /src/embed.tsx as module).
 * For the distributable, run: pnpm build && use vite.embed.config.
 */
export default defineConfig({
  plugins: [react()],
  root: ".",
  publicDir: "public",
  server: { port: 5173 },
});
