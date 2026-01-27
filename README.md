# Commentation – Figma-style comments for websites

A reusable, open-source overlay that lets you add pin-based comment threads to any page. Load it with a single script tag; comments are stored via a small backend API (Node + Express + SQLite).

## Repo layout

- **`frontend/`** – React overlay + embeddable build (`dist/embed.js`)
- **`backend/`** – Express API, Prisma, SQLite
- Root `package.json` – scripts to run and build both

## Setup

### 1. Install dependencies

From the repo root:

```bash
npm install
```

### 2. Backend env and database

```bash
cd backend
cp .env.example .env
# Edit .env if you want a different PORT or DATABASE_URL.
```

From the repo root, generate the Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate:dev
```

(`prisma:migrate:dev` creates the SQLite DB and applies migrations.)

### 3. Run locally

**Option A – run everything at once**

```bash
npm run dev
```

This starts:

- **Frontend** – demo page at [http://localhost:5173](http://localhost:5173) (Vite dev server).
- **Backend** – API at [http://localhost:4000](http://localhost:4000).

**Option B – run separately**

```bash
npm run dev:backend   # API on :4000
npm run dev:frontend  # Demo on :5173
```

The demo page loads the overlay with `data-project-id="walkwise-web"` and `data-backend-url="http://localhost:4000"`. Turn on comment mode (💬), click the page to add a pin and first comment, then use the sidebar to view threads, reply, and resolve.

### 4. Build for production

```bash
npm run build
```

- **Frontend** – writes `frontend/dist/embed.js` (single IIFE bundle with CSS inlined; no separate stylesheet).
- **Backend** – compiles to `backend/dist/`.

## Embedding on any site

In dev or staging, add:

```html
<script
  src="https://my-domain.com/embed.js"
  data-project-id="my-project"
  data-backend-url="https://comments-api.my-domain.com"
></script>
```

- **`data-project-id`** – project slug (e.g. `walkwise-web`). Required.
- **`data-backend-url`** – base URL of the comments API. Required.

If either is missing, the script logs a console warning and does nothing.

For local testing, point the script at your built embed and backend:

```html
<script
  src="http://localhost:5173/src/embed.tsx"
  type="module"
  data-project-id="walkwise-web"
  data-backend-url="http://localhost:4000"
></script>
```

(Use `type="module"` only when loading the dev entry; the production bundle is a normal script.)

Or build the overlay and serve `frontend/dist/embed.js` from any host, e.g.:

```html
<script
  src="http://localhost:8080/embed.js"
  data-project-id="walkwise-web"
  data-backend-url="http://localhost:4000"
></script>
```

## Backend API (overview)

- **GET** `/api/projects/:projectId/threads?pageUrl=...&includeResolved=true|false` – list threads for a page.
- **POST** `/api/projects/:projectId/threads` – create thread + first comment (body: `pageUrl`, `selector`, `xPercent`, `yPercent`, `body`, `createdBy`).
- **GET** `/api/threads/:threadId` – thread + all comments.
- **POST** `/api/threads/:threadId/comments` – add comment (body: `body`, `createdBy`).
- **PATCH** `/api/threads/:threadId` – update status (body: `status: "OPEN" | "RESOLVED"`).

Backend reads `PORT` and `DATABASE_URL` from the environment.

## Deploying later

- **Backend** – e.g. Render, Railway, Fly.io. Set `DATABASE_URL` (can switch to Postgres by changing the Prisma datasource and running migrations).
- **Frontend** – serve `frontend/dist/embed.js` from a CDN or GitHub Pages and use that URL in the script tag.

## Extensibility

The code is structured so you can add:

- Real auth (e.g. GitHub OAuth) – projectId and createdBy can be tied to a user.
- Project/team management – backend already has a Project model.
- GitHub Issue sync – thread/comment types and API are a good base for webhooks and sync jobs.
- Richer DOM anchoring – `frontend/src/anchoring.ts` isolates selector and coordinate logic so you can plug in more robust strategies later.
