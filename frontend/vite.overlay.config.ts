import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { libInjectCss } from "vite-plugin-lib-inject-css";

/**
 * Builds Overlay as ESM for React app consumption.
 * Output: dist/Overlay.js — use in landing via import { Overlay } from 'commentation/Overlay'
 */
export default defineConfig({
  plugins: [react(), libInjectCss()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/Overlay.tsx"),
      name: "CommentationOverlay",
      formats: ["es"],
      fileName: () => "Overlay.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
      external: ["react", "react-dom"],
    },
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    target: "es2020",
  },
});
