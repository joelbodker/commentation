/**
 * Commentation API — Next.js App Router.
 * Serves /__commentation__/api/* and reads/writes .commentation/data.json at project root.
 *
 * Copy to your app: app/__commentation__/api/[[...path]]/route.ts
 * Update the import below to your data module (e.g. @/lib/commentation-data or ./commentation-data if colocated).
 */
import { NextRequest, NextResponse } from "next/server";
import {
  loadData,
  saveData,
  findThread,
  getPageData,
  id,
  type Thread,
  type Comment,
  type ActivityLogEntry,
} from "./commentation-data";

const root = process.cwd();

function sendJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const pathSegments = (await params).path ?? [];
  const path = "/" + pathSegments.join("/");
  const { searchParams } = new URL(request.url);

  try {
    if (path === "/health") return sendJson({ ok: true });

    const getLogMatch = path.match(/^\/projects\/([^/]+)\/activity-log$/);
    if (getLogMatch) {
      const data = loadData(root);
      return sendJson(data.activityLog ?? []);
    }

    const listMatch = path.match(/^\/projects\/([^/]+)\/threads$/);
    if (listMatch) {
      const projectId = listMatch[1];
      const pageUrl = searchParams.get("pageUrl");
      const statusFilter = searchParams.get("status") || "open";
      const data = loadData(root);
      const status =
        statusFilter === "resolved" ? "RESOLVED" : statusFilter === "all" ? null : "OPEN";
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
      const withMeta = threads.map((t) => {
        const comments = t.comments ?? [];
        const latest = comments.length > 0 ? comments[comments.length - 1] : null;
        return { ...t, latestComment: latest, commentCount: comments.length };
      });
      return sendJson(withMeta);
    }

    const getThreadMatch = path.match(/^\/threads\/([^/]+)$/);
    if (getThreadMatch) {
      const data = loadData(root);
      const found = findThread(data, getThreadMatch[1]);
      if (!found) return sendJson({ error: "Thread not found" }, 404);
      return sendJson(found.thread);
    }

    return sendJson({ error: "Not found" }, 404);
  } catch (err) {
    console.error("[Commentation]", err);
    return sendJson({ error: "Internal server error" }, 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const pathSegments = (await params).path ?? [];
  const path = "/" + pathSegments.join("/");
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {}

  try {
    const addLogMatch = path.match(/^\/projects\/([^/]+)\/activity-log$/);
    if (addLogMatch) {
      const projectId = addLogMatch[1];
      const { threadId, type, message, meta } = body as {
        threadId?: string;
        type?: string;
        message?: string;
        meta?: Record<string, unknown>;
      };
      if (!message) return sendJson({ error: "Required: message" }, 400);
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
      if (data.activityLog.length > 500) data.activityLog = data.activityLog.slice(-500);
      saveData(root, data);
      return sendJson(entry, 201);
    }

    const createMatch = path.match(/^\/projects\/([^/]+)\/threads$/);
    if (createMatch) {
      const projectId = createMatch[1];
      const {
        pageUrl,
        selector,
        xPercent,
        yPercent,
        offsetRatioX,
        offsetRatioY,
        body: commentBody,
        createdBy,
      } = body as Record<string, unknown>;
      if (
        !pageUrl ||
        selector == null ||
        xPercent == null ||
        yPercent == null ||
        !commentBody ||
        !createdBy
      ) {
        return sendJson(
          { error: "Required: pageUrl, selector, xPercent, yPercent, body, createdBy" },
          400
        );
      }
      const data = loadData(root);
      const page = getPageData(data, projectId, pageUrl as string);
      const threadId = id();
      const commentId = id();
      const now = new Date().toISOString();
      const thread: Thread = {
        id: threadId,
        projectId,
        pageUrl: pageUrl as string,
        selector: selector as string,
        xPercent: Number(xPercent),
        yPercent: Number(yPercent),
        offsetRatioX: typeof offsetRatioX === "number" ? offsetRatioX : undefined,
        offsetRatioY: typeof offsetRatioY === "number" ? offsetRatioY : undefined,
        status: "OPEN",
        createdBy: createdBy as string,
        createdAt: now,
        resolvedBy: null,
        resolvedAt: null,
        assignedTo: null,
        assignedBy: null,
        assignedAt: null,
        comments: [
          {
            id: commentId,
            threadId,
            body: commentBody as string,
            createdBy: createdBy as string,
            createdAt: now,
          },
        ],
      };
      page.threads.push(thread);
      page.order.push(threadId);
      saveData(root, data);
      return sendJson(thread, 201);
    }

    const addCommentMatch = path.match(/^\/threads\/([^/]+)\/comments$/);
    if (addCommentMatch) {
      const threadId = addCommentMatch[1];
      const { body: commentBody, createdBy } = body as { body?: string; createdBy?: string };
      if (!commentBody || !createdBy)
        return sendJson({ error: "Required: body, createdBy" }, 400);
      const data = loadData(root);
      const found = findThread(data, threadId);
      if (!found) return sendJson({ error: "Thread not found" }, 404);
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
      return sendJson(comment, 201);
    }

    return sendJson({ error: "Not found" }, 404);
  } catch (err) {
    console.error("[Commentation]", err);
    return sendJson({ error: "Internal server error" }, 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const pathSegments = (await params).path ?? [];
  const path = "/" + pathSegments.join("/");
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return sendJson({ error: "Invalid JSON" }, 400);
  }
  const patchMatch = path.match(/^\/threads\/([^/]+)$/);
  if (!patchMatch) return sendJson({ error: "Not found" }, 404);
  const threadId = patchMatch[1];
  const {
    status,
    resolvedBy,
    assignedTo,
    assignedBy,
    selector,
    xPercent,
    yPercent,
    offsetRatioX,
    offsetRatioY,
  } = body as Record<string, unknown>;

  try {
    const data = loadData(root);
    const found = findThread(data, threadId);
    if (!found) return sendJson({ error: "Thread not found" }, 404);
    const t = found.thread;
    if (status !== undefined) {
      if (status !== "OPEN" && status !== "RESOLVED")
        return sendJson({ error: "status must be 'OPEN' or 'RESOLVED'" }, 400);
      t.status = status as string;
      if (status === "RESOLVED") {
        t.resolvedBy = (resolvedBy as string) ?? null;
        t.resolvedAt = new Date().toISOString();
      } else {
        t.resolvedBy = null;
        t.resolvedAt = null;
      }
    }
    if (assignedTo !== undefined) {
      t.assignedTo = (assignedTo as string | null) ?? null;
      t.assignedBy = (assignedBy as string | null) ?? null;
      t.assignedAt =
        assignedTo != null && assignedTo !== "" ? new Date().toISOString() : null;
    }
    if (selector !== undefined) t.selector = selector as string;
    if (xPercent !== undefined) t.xPercent = xPercent as number;
    if (yPercent !== undefined) t.yPercent = yPercent as number;
    if (offsetRatioX !== undefined) t.offsetRatioX = (offsetRatioX as number) ?? undefined;
    if (offsetRatioY !== undefined) t.offsetRatioY = (offsetRatioY as number) ?? undefined;
    saveData(root, data);
    return sendJson(t);
  } catch (err) {
    console.error("[Commentation]", err);
    return sendJson({ error: "Internal server error" }, 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const pathSegments = (await params).path ?? [];
  const path = "/" + pathSegments.join("/");
  const deleteMatch = path.match(/^\/threads\/([^/]+)$/);
  if (!deleteMatch) return sendJson({ error: "Not found" }, 404);
  const threadId = deleteMatch[1];
  try {
    const data = loadData(root);
    const found = findThread(data, threadId);
    if (!found) return sendJson({ error: "Thread not found" }, 404);
    const page = getPageData(data, found.projectId, found.pageUrl);
    page.threads = page.threads.filter((t) => t.id !== threadId);
    page.order = page.order.filter((orderId) => orderId !== threadId);
    saveData(root, data);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[Commentation]", err);
    return sendJson({ error: "Internal server error" }, 500);
  }
}
