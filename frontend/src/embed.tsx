/**
 * Embeddable entry: run when loaded via <script src=".../embed.js" data-project-id="...">.
 * Reads config from the script tag, creates #fig-comments-root, and mounts the overlay.
 */
import React, { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Overlay } from "./Overlay";

const CONTAINER_ID = "fig-comments-root";

function getScriptConfig(): { projectId: string; hintText?: string } | null {
  const script =
    document.currentScript ??
    document.querySelector(`script[data-project-id]`);
  if (!script || !(script instanceof HTMLScriptElement)) return null;
  const projectId = script.getAttribute("data-project-id")?.trim();
  if (!projectId) return null;
  const hintText = script.getAttribute("data-hint-text")?.trim() || undefined;
  return { projectId, hintText };
}

class ErrorBoundary extends Component<
  { projectId: string; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[Commentation]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 2147483647,
            padding: "8px 16px",
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 28,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            fontFamily: "system-ui, sans-serif",
            fontSize: 14,
            color: "#333",
          }}
        >
          Commentation error — check console
        </div>
      );
    }
    return this.props.children;
  }
}

function main() {
  const config = getScriptConfig();
  if (!config) {
    console.warn(
      "[Commentation] Missing data-project-id on the script tag. Skipping overlay."
    );
    return;
  }

  // Ensure body is positioned for absolute children
  if (!document.body.style.position || document.body.style.position === "static") {
    document.body.style.position = "relative";
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
      <ErrorBoundary projectId={config.projectId}>
        <Overlay projectId={config.projectId} hintText={config.hintText} />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

main();
