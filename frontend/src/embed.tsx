/**
 * Embeddable entry: run when loaded via <script src=".../embed.js" data-project-id="..." data-backend-url="...">.
 * Reads config from the script tag, creates #fig-comments-root, and mounts the overlay.
 * Bundled as IIFE so React/ReactDOM are included; host page needs nothing else.
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { Overlay } from "./Overlay";

const CONTAINER_ID = "fig-comments-root";

function getScriptConfig(): { projectId: string; backendUrl: string } | null {
  const script =
    document.currentScript ??
    document.querySelector(`script[data-project-id][data-backend-url]`);
  if (!script || !(script instanceof HTMLScriptElement)) return null;
  const projectId = script.getAttribute("data-project-id")?.trim();
  const backendUrl = script.getAttribute("data-backend-url")?.trim();
  if (!projectId || !backendUrl) return null;
  return { projectId, backendUrl };
}

function main() {
  const config = getScriptConfig();
  if (!config) {
    console.warn(
      "[Fig Comments] Missing data-project-id or data-backend-url on the script tag. Skipping overlay."
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
      <Overlay projectId={config.projectId} backendUrl={config.backendUrl} />
    </React.StrictMode>
  );
}

main();
