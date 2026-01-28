/**
 * Embeddable entry: run when loaded via <script src=".../embed.js" data-project-id="...">.
 * Reads config from the script tag, creates #fig-comments-root, and mounts the overlay.
 * Uses in-memory store only (no API).
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { Overlay } from "./Overlay";

const CONTAINER_ID = "fig-comments-root";

function getScriptConfig(): { projectId: string } | null {
  const script =
    document.currentScript ??
    document.querySelector(`script[data-project-id]`);
  if (!script || !(script instanceof HTMLScriptElement)) return null;
  const projectId = script.getAttribute("data-project-id")?.trim();
  if (!projectId) return null;
  return { projectId };
}

function main() {
  const config = getScriptConfig();
  if (!config) {
    console.warn(
      "[Commentation] Missing data-project-id on the script tag. Skipping overlay."
    );
    return;
  }

  let rootEl = document.getElementById(CONTAINER_ID);
  if (!rootEl) {
    rootEl = document.createElement("div");
    rootEl.id = CONTAINER_ID;
    document.body.appendChild(rootEl);
  }

  const root = createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <Overlay projectId={config.projectId} />
    </React.StrictMode>
  );
}

main();
