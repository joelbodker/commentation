# Installation & integration improvements

This doc summarizes the improvements made so that installing Commentation in any project (Vite, Next.js, or script-only) is straightforward.

## What was done

- **API contract** – [docs/API.md](API.md) documents the full API (base path, data file shape, routes). Any backend can implement persistence without reading the Vite plugin source.
- **Next.js support** – [packages/commentation/nextjs/](../packages/commentation/nextjs/) provides a drop-in App Router route handler and data module. Copy them into your app so `/__commentation__/api/*` reads/writes `.commentation/data.json`.
- **Package layout** – `packages/commentation` is the publishable package named `commentation`. It exposes:
  - Pre-built `dist/embed.js` (canonical path: `node_modules/commentation/dist/embed.js`)
  - `commentation/vite` – Vite plugin
  - `commentation/Overlay` – React Overlay for in-app use
  - `commentation/embed` – embed script path
- **README** – Restructured with “How it works” (install once, works everywhere), “Quick install” (Vite, Next.js, script-only) first, then detailed embedding and running locally.

## Design principles

1. **Install once in the root** – One script tag (and for persistence, one plugin or one route file). No cloning the repo or custom build scripts.
2. **Works everywhere** – One script in the root makes the overlay available on every page and in modals, tooltips, and dynamic content. No per-page or per-component setup.
3. **Zero reliance on host build** – The published package ships a pre-built `dist/embed.js`. The host never runs a build for Commentation. No `dependencies` in the package (embed is self-contained); only optional `peerDependencies` for the Vite plugin.

## Remaining / optional

- **Publish to npm** – Run `npm run build:package` from the repo root before publishing so the tarball includes an up-to-date `dist/embed.js`. Publish from `packages/commentation` (not the monorepo root).
- **Install script or CLI** – Optional: `npx commentation init` (or similar) to copy the embed and add the script tag / route for the detected framework.
- **CI publish** – Optional: GitHub Action to build and publish the package on release.

See the full improvement guide (source for this work) for the complete checklist and rationale.
