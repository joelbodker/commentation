import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { libInjectCss } from "vite-plugin-lib-inject-css";

/**
 * Produces a single IIFE bundle for script-tag embedding.
 * Output: dist/embed.js — self-contained, includes React/ReactDOM and injected CSS.
 */
export default defineConfig({
  plugins: [react(), libInjectCss()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/embed.tsx"),
      name: "FigComments",
      formats: ["iife"],
      fileName: () => "embed.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    target: "es2020",
  },
});
