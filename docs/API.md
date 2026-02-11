# Commentation API contract

Any backend (Vite plugin, Next.js route, Express, etc.) that implements this contract can persist comments for the Commentation overlay. The embed talks to `/__commentation__/api` by default (overridable via `data-commentation-url` on the script tag).

## Base path

- **Default:** `/__commentation__/api` (embed at `/__commentation__/embed.js`, API at `/__commentation__/api`)
- **Override:** Set `data-commentation-url="https://other-origin.com"` (or a path) on the script tag to point the embed elsewhere.

## Data file

- **Path:** `.commentation/data.json` at the project root (or server `cwd`).
- **Structure:** See types below. Create `.commentation` directory if missing.

### Types

```ts
type Comment = {
  id: string;
  threadId: string;
  body: string;
  createdBy: string;
  createdAt: string; // ISO
};

type Thread = {
  id: string;
  projectId: string;
  pageUrl: string;
  selector: string;
  xPercent: number;
  yPercent: number;
  offsetRatioX?: number;
  offsetRatioY?: number;
  status: "OPEN" | "RESOLVED";
  createdBy: string;
  createdAt: string;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  assignedTo?: string | null;
  assignedBy?: string | null;
  assignedAt?: string | null;
  comments: Comment[];
};

type PageData = {
  threads: Thread[];
  order: string[];
};

type ActivityLogEntry = {
  id: string;
  threadId: string | null;
  type: string;
  message: string;
  timestamp: string;
  meta?: Record<string, unknown>;
};

type DataFile = {
  projects: Record<string, Record<string, PageData>>;
  activityLog?: ActivityLogEntry[];
};
```

## Routes

All paths are relative to the API base (e.g. `/__commentation__/api`). So the full path for health is `/__commentation__/api/health`.

| Method | Path | Description | Request body | Response |
|--------|------|-------------|--------------|----------|
| GET | `/health` | Liveness | — | `{ ok: true }` |
| GET | `/projects/:projectId/activity-log` | List activity log | — | `ActivityLogEntry[]` |
| POST | `/projects/:projectId/activity-log` | Append log entry | `{ threadId?, type?, message, meta? }` | Created entry (201) |
| GET | `/projects/:projectId/threads` | List threads | Query: `pageUrl?`, `status=open\|resolved\|all` | Thread list with `latestComment` and `commentCount` |
| POST | `/projects/:projectId/threads` | Create thread | `{ pageUrl, selector, xPercent, yPercent, offsetRatioX?, offsetRatioY?, body, createdBy }` | Created thread (201) |
| GET | `/threads/:threadId` | Get thread | — | Thread or 404 |
| POST | `/threads/:threadId/comments` | Add comment | `{ body, createdBy }` | Created comment (201) |
| PATCH | `/threads/:threadId` | Update thread | `{ status?, resolvedBy?, assignedTo?, assignedBy?, selector?, xPercent?, yPercent?, offsetRatioX?, offsetRatioY? }` | Updated thread |
| DELETE | `/threads/:threadId` | Delete thread | — | 204 |

## ID generation

Use a short unique id, e.g. `Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11)`.

## Persistence

Read/write the single `data.json` file; create `.commentation` directory if missing. No database required for the file-based implementation (Vite plugin, Next.js drop-in route).
