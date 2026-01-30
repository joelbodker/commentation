# Commentation – Figma-style comments for websites

A reusable, open-source overlay that lets you add pin-based comment threads to any page. **Local-first**: comments live in `.commentation/` and sync via Git — no server or API required. Developers on different branches can add comments, commit, push, and teammates see them when they pull.

## Repo layout

- **`frontend/`** – React overlay + embeddable build (`dist/embed.js`), Vite plugin for local storage
- **`backend/`** – Legacy Express API (optional; not used by default)

## Setup

### 1. Install dependencies

From the repo root:

```bash
npm install
```

### 2. Run locally

```bash
npm run dev
```

This starts the demo at [http://localhost:5173](http://localhost:5173). The Vite plugin serves the Commentation API at `/__commentation__/api` and writes comments to `frontend/.commentation/data.json`.

Turn on comment mode (💬), click the page to add a pin and first comment, then use the sidebar to view threads, reply, resolve, and assign.

### 3. Sync comments with your team

Comments are stored in `.commentation/data.json`. Commit and push to share:

```bash
git add .commentation/
git commit -m "Add design feedback"
git push
```

Teammates pull and see your comments. Branch-scoped: comments on `feature-x` stay with that branch until merged.

## Embedding in your project

### With Vite

1. Add the Commentation plugin to your `vite.config.ts` (copy `frontend/vite-plugin-commentation.ts` into your project, or import from your local path):

```ts
import { commentationPlugin } from "./vite-plugin-commentation";

export default defineConfig({
  plugins: [react(), commentationPlugin()],
  // ...
});
```

2. Load the overlay in your HTML:

```html
<script
  src="/src/embed.tsx"
  type="module"
  data-project-id="my-project"
></script>
```

Comments will be written to `.commentation/` at your Vite project root. Commit them to sync via Git.

### Without the plugin

If the plugin isn’t active (e.g. production build, static site), the overlay falls back to an in-memory store. Comments won’t persist across refreshes or sync — use the plugin in dev for full functionality.

## Build for production

```bash
npm run build
```

Writes `frontend/dist/embed.js` (single IIFE bundle with CSS inlined).

## Extensibility

- **DOM anchoring** – `frontend/src/anchoring.ts` isolates selector and coordinate logic for pluggable strategies.
- **Auth** – `createdBy` and `assignedTo` are plain strings; tie them to your auth system as needed.
- **GitHub sync** – The data model is a good base for webhooks or sync jobs to GitHub Issues.
