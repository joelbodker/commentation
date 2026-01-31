/**
 * Vite plugin: serves Commentation API from .commentation/ and writes updates to disk.
 * Comments sync via Git — commit and push to share with your team.
 */
import type { Plugin } from "vite";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_PREFIX = "/__commentation__/api";
const EMBED_PATH = "/__commentation__/embed.js";
const DATA_FILE = ".commentation/data.json";

type Comment = {
  id: string;
  threadId: string;
  body: string;
  createdBy: string;
  createdAt: string;
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
  status: string;
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

function id(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function getDataPath(root: string): string {
  return join(root, DATA_FILE);
}

function loadData(root: string): DataFile {
  const path = getDataPath(root);
  if (!existsSync(path)) {
    return { projects: {}, activityLog: [] };
  }
  try {
    const raw = readFileSync(path, "utf-8");
    const data = JSON.parse(raw) as DataFile;
    if (!data.activityLog) data.activityLog = [];
    return data;
  } catch {
    return { projects: {}, activityLog: [] };
  }
}

function saveData(root: string, data: DataFile): void {
  const path = getDataPath(root);
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}

function findThread(data: DataFile, threadId: string): { thread: Thread; projectId: string; pageUrl: string } | null {
  for (const [projectId, pages] of Object.entries(data.projects)) {
    for (const [pageUrl, pageData] of Object.entries(pages)) {
      const thread = pageData.threads.find((t) => t.id === threadId);
      if (thread) return { thread, projectId, pageUrl };
    }
  }
  return null;
}

function getPageData(data: DataFile, projectId: string, pageUrl: string): PageData {
  if (!data.projects[projectId]) data.projects[projectId] = {};
  if (!data.projects[projectId][pageUrl]) {
    data.projects[projectId][pageUrl] = { threads: [], order: [] };
  }
  return data.projects[projectId][pageUrl];
}

export function commentationPlugin(): Plugin {
  let root: string;

  return {
    name: "commentation",
    configResolved(config) {
      root = config.root;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Serve embed.js from package dist (works when installed via npm)
        const reqPath = req.url?.split("?")[0];
        if (reqPath === EMBED_PATH) {
          try {
            const embedPath = join(__dirname, "dist", "embed.js");
            const code = readFileSync(embedPath, "utf-8");
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/javascript");
            res.end(code);
          } catch {
            res.statusCode = 404;
            res.end("Commentation embed not found. Run npm run build:package first.");
          }
          return;
        }
        if (!req.url?.startsWith(API_PREFIX)) return next();

        const url = new URL(req.url, `http://${req.headers.host}`);
        const path = url.pathname.slice(API_PREFIX.length);
        const method = req.method ?? "GET";

        const sendJson = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };

        const readBody = (): Promise<unknown> =>
          new Promise((resolve, reject) => {
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch {
                reject(new Error("Invalid JSON"));
              }
            });
            req.on("error", reject);
          });

        try {
          // GET /api/health
          if (path === "/health" && method === "GET") {
            return sendJson(200, { ok: true });
          }

          // GET /api/projects/:projectId/activity-log
          const getLogMatch = path.match(/^\/projects\/([^/]+)\/activity-log$/);
          if (getLogMatch && method === "GET") {
            const data = loadData(root);
            const entries = data.activityLog ?? [];
            return sendJson(200, entries);
          }

          // POST /api/projects/:projectId/activity-log
          const addLogMatch = path.match(/^\/projects\/([^/]+)\/activity-log$/);
          if (addLogMatch && method === "POST") {
            const projectId = addLogMatch[1];
            const body = (await readBody()) as {
              threadId?: string;
              type?: string;
              message?: string;
              meta?: Record<string, unknown>;
            };
            const { threadId, type, message, meta } = body;
            if (!message) {
              return sendJson(400, { error: "Required: message" });
            }
            const data = loadData(root);
            if (!data.activityLog) data.activityLog = [];
            const entry: ActivityLogEntry = {
              id: id(),
              threadId: threadId ?? null,
              type: type ?? "generic",
              message,
              timestamp: new Date().toISOString(),
              meta: meta ?? undefined,
            };
            data.activityLog.push(entry);
            if (data.activityLog.length > 500) {
              data.activityLog = data.activityLog.slice(-500);
            }
            saveData(root, data);
            return sendJson(201, entry);
          }

          // GET /api/projects/:projectId/threads?pageUrl=...&status=open|resolved|all
          const listMatch = path.match(/^\/projects\/([^/]+)\/threads$/);
          if (listMatch && method === "GET") {
            const projectId = listMatch[1];
            const pageUrl = url.searchParams.get("pageUrl");
            const statusFilter = url.searchParams.get("status") || "open";
            const data = loadData(root);
            const status = statusFilter === "resolved" ? "RESOLVED" : statusFilter === "all" ? null : "OPEN";
            let threads: Thread[] = [];
            if (pageUrl) {
              const page = getPageData(data, projectId, pageUrl);
              threads = page.threads.filter((t) => status === null || t.status === status);
            } else {
              const pages = data.projects[projectId];
              if (pages) {
                for (const pageData of Object.values(pages)) {
                  threads = threads.concat(
                    pageData.threads.filter((t) => status === null || t.status === status)
                  );
                }
              }
            }
            threads = threads.map((t) => {
              const comments = t.comments ?? [];
              const latest = comments.length > 0 ? comments[comments.length - 1] : null;
              return {
                ...t,
                latestComment: latest,
                commentCount: comments.length,
              };
            });
            return sendJson(200, threads);
          }

          // POST /api/projects/:projectId/threads
          const createMatch = path.match(/^\/projects\/([^/]+)\/threads$/);
          if (createMatch && method === "POST") {
            const projectId = createMatch[1];
            const body = (await readBody()) as {
              pageUrl?: string;
              selector?: string;
              xPercent?: number;
              yPercent?: number;
              offsetRatioX?: number;
              offsetRatioY?: number;
              body?: string;
              createdBy?: string;
            };
            const { pageUrl, selector, xPercent, yPercent, offsetRatioX, offsetRatioY, body: commentBody, createdBy } = body;
            if (!pageUrl || selector == null || xPercent == null || yPercent == null || !commentBody || !createdBy) {
              return sendJson(400, { error: "Required: pageUrl, selector, xPercent, yPercent, body, createdBy" });
            }
            const data = loadData(root);
            const page = getPageData(data, projectId, pageUrl);
            const threadId = id();
            const commentId = id();
            const now = new Date().toISOString();
            const thread: Thread = {
              id: threadId,
              projectId,
              pageUrl,
              selector,
              xPercent: Number(xPercent),
              yPercent: Number(yPercent),
              offsetRatioX: typeof offsetRatioX === "number" ? offsetRatioX : undefined,
              offsetRatioY: typeof offsetRatioY === "number" ? offsetRatioY : undefined,
              status: "OPEN",
              createdBy,
              createdAt: now,
              resolvedBy: null,
              resolvedAt: null,
              assignedTo: null,
              assignedBy: null,
              assignedAt: null,
              comments: [
                { id: commentId, threadId, body: commentBody, createdBy, createdAt: now },
              ],
            };
            page.threads.push(thread);
            page.order.push(threadId);
            saveData(root, data);
            return sendJson(201, thread);
          }

          // GET /api/threads/:threadId
          const getThreadMatch = path.match(/^\/threads\/([^/]+)$/);
          if (getThreadMatch && method === "GET") {
            const threadId = getThreadMatch[1];
            const data = loadData(root);
            const found = findThread(data, threadId);
            if (!found) return sendJson(404, { error: "Thread not found" });
            return sendJson(200, found.thread);
          }

          // POST /api/threads/:threadId/comments
          const addCommentMatch = path.match(/^\/threads\/([^/]+)\/comments$/);
          if (addCommentMatch && method === "POST") {
            const threadId = addCommentMatch[1];
            const body = (await readBody()) as { body?: string; createdBy?: string };
            const { body: commentBody, createdBy } = body;
            if (!commentBody || !createdBy) {
              return sendJson(400, { error: "Required: body, createdBy" });
            }
            const data = loadData(root);
            const found = findThread(data, threadId);
            if (!found) return sendJson(404, { error: "Thread not found" });
            const comment: Comment = {
              id: id(),
              threadId,
              body: commentBody,
              createdBy,
              createdAt: new Date().toISOString(),
            };
            found.thread.comments = found.thread.comments ?? [];
            found.thread.comments.push(comment);
            saveData(root, data);
            return sendJson(201, comment);
          }

          // PATCH /api/threads/:threadId
          const patchMatch = path.match(/^\/threads\/([^/]+)$/);
          if (patchMatch && method === "PATCH") {
            const threadId = patchMatch[1];
            const body = (await readBody()) as {
              status?: "OPEN" | "RESOLVED";
              resolvedBy?: string;
              assignedTo?: string | null;
              assignedBy?: string | null;
            };
            const { status, resolvedBy, assignedTo, assignedBy } = body;
            const data = loadData(root);
            const found = findThread(data, threadId);
            if (!found) return sendJson(404, { error: "Thread not found" });
            const t = found.thread;
            if (status !== undefined) {
              if (status !== "OPEN" && status !== "RESOLVED") {
                return sendJson(400, { error: "status must be 'OPEN' or 'RESOLVED'" });
              }
              t.status = status;
              if (status === "RESOLVED") {
                t.resolvedBy = resolvedBy ?? null;
                t.resolvedAt = new Date().toISOString();
              } else {
                t.resolvedBy = null;
                t.resolvedAt = null;
              }
            }
            if (assignedTo !== undefined) {
              t.assignedTo = assignedTo ?? null;
              t.assignedBy = assignedBy ?? null;
              t.assignedAt = assignedTo != null && assignedTo !== "" ? new Date().toISOString() : null;
            }
            saveData(root, data);
            return sendJson(200, t);
          }

          // DELETE /api/threads/:threadId
          const deleteMatch = path.match(/^\/threads\/([^/]+)$/);
          if (deleteMatch && method === "DELETE") {
            const threadId = deleteMatch[1];
            const data = loadData(root);
            const found = findThread(data, threadId);
            if (!found) return sendJson(404, { error: "Thread not found" });
            const page = getPageData(data, found.projectId, found.pageUrl);
            page.threads = page.threads.filter((t) => t.id !== threadId);
            page.order = page.order.filter((id) => id !== threadId);
            saveData(root, data);
            res.statusCode = 204;
            return res.end();
          }

          sendJson(404, { error: "Not found" });
        } catch (err) {
          console.error("[Commentation]", err);
          sendJson(500, { error: "Internal server error" });
        }
      });
    },
  };
}
