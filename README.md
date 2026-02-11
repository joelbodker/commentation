# Commentation – Pin-based contextual comments for websites

A reusable overlay that lets you add pin-based comment threads to any page. **Local-first:** comments live in `.commentation/` and sync via Git. [commentation.dev](https://commentation.dev)

---

## How it works

- **Install once in the root** — One script tag (e.g. in your root layout or `index.html`) and, for persistence, one plugin or one API route. No cloning the repo or custom build scripts.
- **Works everywhere** — The overlay is available on **every page**, and on **any content** (popups, modals, tooltips, dynamic UI). No per-page or per-component setup.

---

## Quick install

### Vite

1. **Install:** `npm install commentation`
2. **Plugin:** Add the Commentation plugin to `vite.config.ts` (see [With Vite](#with-vite) below).
3. **Script tag:** In your `index.html`:  
   `<script src="/__commentation__/embed.js" data-project-id="my-project" type="module"></script>`

The plugin serves the embed and API and writes comments to `.commentation/data.json`. Commit that folder to sync via Git.

### Next.js

1. **Install:** `npm install commentation`
2. **API route:** Copy the [Next.js route and data module](packages/commentation/nextjs/) into your app so `/__commentation__/api/*` is handled (see [packages/commentation/nextjs/README.md](packages/commentation/nextjs/README.md)).
3. **Serve embed:** Copy `node_modules/commentation/dist/embed.js` to `public/__commentation__/embed.js` (or use a rewrite).
4. **Script tag:** In your root layout:  
   `<script src="/__commentation__/embed.js" data-project-id="my-project" defer />`

### Script only (no persistence)

Add a script tag pointing to a CDN or self-hosted `embed.js`. Without an API, comments stay in memory and are lost on refresh. For persistence, use the Vite plugin or the Next.js route (or any backend that implements the [API contract](docs/API.md)).

---

## Embedding in your project

### With Vite

1. Add the plugin. From the repo you can copy `frontend/vite-plugin-commentation.ts` into your project, or (when using the published package) import from `commentation/vite`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { commentationPlugin } from "commentation/vite";

export default defineConfig({
  plugins: [react(), commentationPlugin()],
});
```

2. Load the overlay in your HTML:

```html
<script
  src="/__commentation__/embed.js"
  type="module"
  data-project-id="my-project"
></script>
```

Comments are written to `.commentation/` at your Vite project root. Commit and push to sync with your team.

### With Next.js

Follow the steps in [packages/commentation/nextjs/README.md](packages/commentation/nextjs/README.md): copy the route handler and data helper, serve the embed, and add the script tag in your root layout.

### Without the plugin / other frameworks

If the plugin or Next.js route isn’t active (e.g. static build, different framework), the overlay falls back to an in-memory store. To persist comments, implement the backend contract described in [docs/API.md](docs/API.md) (base path, data file shape, routes). Any server that implements that contract can persist comments.

---

## Repo layout

- **`frontend/`** – React overlay, embeddable build (`dist/embed.js`), and Vite plugin that serves the API and writes to `.commentation/data.json`
- **`packages/commentation/`** – Publishable package: pre-built `dist/embed.js`, Vite plugin, Overlay for React apps, and Next.js route + data module
- **`backend/`** – Optional Express API (e.g. for hosted deployments); not required for local Vite/Next.js file-based persistence
- **`docs/API.md`** – Full API contract for custom backends

---

## Running Commentation locally

From the repo root:

```bash
npm install
npm run dev
```

This starts the landing site at [http://localhost:5174](http://localhost:5174) (requires the `commentation-landing` repo cloned as a sibling: `../commentation-landing`). To run only the overlay and minimal dev page: `npm run dev:frontend` → [http://localhost:5173](http://localhost:5173). The Vite plugin serves the API at `/__commentation__/api` and writes to `frontend/.commentation/data.json`.

---

## Syncing comments via Git

Comments and activity logs are stored in `.commentation/data.json`. Commit and push to share:

```bash
git add .commentation/
git commit -m "Add design feedback"
git push
```

Teammates pull and see your comments. Branch-scoped: comments on `feature-x` stay with that branch until merged.

---

## Build for production

From the repo root:

```bash
npm run build
```

Produces `frontend/dist/embed.js` (single IIFE bundle with CSS inlined). The publishable package is built with `npm run build:package`, which also copies the embed and Overlay into `packages/commentation/dist/`.

---

## Extensibility

- **DOM anchoring** – `frontend/src/anchoring.ts` holds selector and coordinate logic for pluggable strategies.
- **Auth** – `createdBy` and `assignedTo` are plain strings; wire them to your auth system as needed.
- **API** – See [docs/API.md](docs/API.md) for the full route table and data file format so you can implement persistence in any stack.
