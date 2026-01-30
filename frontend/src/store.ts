/**
 * In-memory store for threads and comments. No API.
 * Keyed by projectId + pageUrl.
 */

export type ThreadStatus = "OPEN" | "RESOLVED";

export type Comment = {
  id: string;
  threadId: string;
  body: string;
  createdBy: string;
  createdAt: string;
};

export type Thread = {
  id: string;
  projectId: string;
  pageUrl: string;
  selector: string;
  xPercent: number;
  yPercent: number;
  status: ThreadStatus;
  createdBy: string;
  createdAt: string;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  assignedTo?: string | null;
  assignedBy?: string | null;
  assignedAt?: string | null;
  comments: Comment[];
};

export type ThreadListItem = Thread & {
  latestComment: Comment | null;
  commentCount: number;
};

function id(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function toListItem(t: Thread): ThreadListItem {
  const comments = t.comments ?? [];
  const latest = comments.length > 0 ? comments[comments.length - 1] : null;
  return {
    ...t,
    latestComment: latest,
    commentCount: comments.length,
  };
}

const byKey = new Map<string, Thread[]>();

function key(projectId: string, pageUrl: string): string {
  return `${projectId}\0${pageUrl}`;
}

function getList(projectId: string, pageUrl: string): Thread[] {
  const k = key(projectId, pageUrl);
  if (!byKey.has(k)) byKey.set(k, []);
  return byKey.get(k)!;
}

export function getThreads(
  projectId: string,
  pageUrl: string | null,
  statusFilter: "open" | "resolved" | "all"
): ThreadListItem[] {
  const status = statusFilter === "all" ? null : statusFilter === "open" ? "OPEN" : "RESOLVED";
  if (pageUrl) {
    const list = getList(projectId, pageUrl);
    return list.filter((t) => status === null || t.status === status).map(toListItem);
  }
  const prefix = `${projectId}\0`;
  const all: Thread[] = [];
  for (const [k, list] of byKey) {
    if (k.startsWith(prefix)) all.push(...list);
  }
  return all.filter((t) => status === null || t.status === status).map(toListItem);
}

export function createThread(
  projectId: string,
  pageUrl: string,
  params: {
    selector: string;
    xPercent: number;
    yPercent: number;
    body: string;
    createdBy: string;
  }
): Thread {
  const threadId = id();
  const commentId = id();
  const now = new Date().toISOString();
  const comment: Comment = {
    id: commentId,
    threadId,
    body: params.body,
    createdBy: params.createdBy,
    createdAt: now,
  };
  const thread: Thread = {
    id: threadId,
    projectId,
    pageUrl,
    selector: params.selector,
    xPercent: params.xPercent,
    yPercent: params.yPercent,
    status: "OPEN",
    createdBy: params.createdBy,
    createdAt: now,
    resolvedBy: null,
    resolvedAt: null,
    assignedTo: null,
    assignedBy: null,
    assignedAt: null,
    comments: [comment],
  };
  getList(projectId, pageUrl).push(thread);
  return thread;
}

export function getThread(
  projectId: string,
  pageUrl: string | null,
  threadId: string
): Thread | null {
  if (pageUrl) {
    const list = getList(projectId, pageUrl);
    return list.find((t) => t.id === threadId) ?? null;
  }
  const prefix = `${projectId}\0`;
  for (const [k, list] of byKey) {
    if (k.startsWith(prefix)) {
      const t = list.find((x) => x.id === threadId);
      if (t) return t;
    }
  }
  return null;
}

export function addComment(
  projectId: string,
  pageUrl: string,
  threadId: string,
  body: string,
  createdBy: string
): Thread | null {
  const t = getThread(projectId, pageUrl, threadId);
  if (!t) return null;
  const comment: Comment = {
    id: id(),
    threadId,
    body,
    createdBy,
    createdAt: new Date().toISOString(),
  };
  t.comments = t.comments ? [...t.comments, comment] : [comment];
  return t;
}

export function updateThreadStatus(
  projectId: string,
  pageUrl: string,
  threadId: string,
  status: "OPEN" | "RESOLVED",
  resolvedBy?: string
): Thread | null {
  const t = getThread(projectId, pageUrl, threadId);
  if (!t) return null;
  t.status = status;
  if (status === "RESOLVED") {
    t.resolvedBy = resolvedBy ?? null;
    t.resolvedAt = new Date().toISOString();
  } else {
    t.resolvedBy = null;
    t.resolvedAt = null;
  }
  return t;
}

export function assignThread(
  projectId: string,
  pageUrl: string,
  threadId: string,
  assignedTo: string,
  assignedBy: string
): Thread | null {
  const t = getThread(projectId, pageUrl, threadId);
  if (!t) return null;
  t.assignedTo = assignedTo;
  t.assignedBy = assignedBy;
  t.assignedAt = new Date().toISOString();
  return t;
}

export function deleteThread(
  projectId: string,
  pageUrl: string,
  threadId: string
): void {
  const list = getList(projectId, pageUrl);
  const i = list.findIndex((t) => t.id === threadId);
  if (i >= 0) list.splice(i, 1);
}
