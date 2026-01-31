/**
 * API client for Commentation — talks to the local Vite plugin at /__commentation__/api.
 * Used when the plugin is active (dev mode); falls back to in-memory store otherwise.
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

function baseUrl(): string {
  if (typeof window === "undefined") return "";
  const script = document.querySelector('script[data-commentation-url]');
  const url = script?.getAttribute("data-commentation-url");
  return url?.trim() || "/__commentation__";
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function checkAvailable(): Promise<boolean> {
  try {
    const base = baseUrl();
    if (!base) return false;
    const res = await fetch(`${base}/api/health`, { method: "GET" });
    if (!res.ok) return false;
    // Vite SPA fallback returns HTML for unknown routes; verify we got JSON
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) return false;
    const data = (await res.json()) as { ok?: boolean };
    return data?.ok === true;
  } catch {
    return false;
  }
}

export async function getThreads(
  projectId: string,
  pageUrl: string | null,
  statusFilter: "open" | "resolved" | "all"
): Promise<ThreadListItem[]> {
  const base = baseUrl();
  const status = statusFilter === "all" ? "all" : statusFilter === "open" ? "open" : "resolved";
  const url = pageUrl
    ? `${base}/api/projects/${encodeURIComponent(projectId)}/threads?pageUrl=${encodeURIComponent(pageUrl)}&status=${status}`
    : `${base}/api/projects/${encodeURIComponent(projectId)}/threads?status=${status}`;
  return fetchJson<ThreadListItem[]>(url);
}

export async function createThread(
  projectId: string,
  pageUrl: string,
  params: {
    selector: string;
    xPercent: number;
    yPercent: number;
    body: string;
    createdBy: string;
  }
): Promise<Thread> {
  const base = baseUrl();
  const url = `${base}/api/projects/${encodeURIComponent(projectId)}/threads`;
  return fetchJson<Thread>(url, {
    method: "POST",
    body: JSON.stringify({
      pageUrl,
      selector: params.selector,
      xPercent: params.xPercent,
      yPercent: params.yPercent,
      body: params.body,
      createdBy: params.createdBy,
    }),
  });
}

export async function getThread(
  projectId: string,
  pageUrl: string,
  threadId: string
): Promise<Thread | null> {
  const base = baseUrl();
  const url = `${base}/api/threads/${encodeURIComponent(threadId)}`;
  try {
    return await fetchJson<Thread>(url);
  } catch {
    return null;
  }
}

export async function addComment(
  projectId: string,
  pageUrl: string,
  threadId: string,
  body: string,
  createdBy: string
): Promise<Thread | null> {
  const base = baseUrl();
  const url = `${base}/api/threads/${encodeURIComponent(threadId)}/comments`;
  await fetchJson<Comment>(url, {
    method: "POST",
    body: JSON.stringify({ body, createdBy }),
  });
  return getThread(projectId, pageUrl, threadId);
}

export async function updateThreadStatus(
  projectId: string,
  pageUrl: string,
  threadId: string,
  status: "OPEN" | "RESOLVED",
  resolvedBy?: string
): Promise<Thread | null> {
  const base = baseUrl();
  const url = `${base}/api/threads/${encodeURIComponent(threadId)}`;
  await fetchJson<Thread>(url, {
    method: "PATCH",
    body: JSON.stringify({ status, resolvedBy }),
  });
  return getThread(projectId, pageUrl, threadId);
}

export async function assignThread(
  projectId: string,
  pageUrl: string,
  threadId: string,
  assignedTo: string,
  assignedBy: string
): Promise<Thread | null> {
  const base = baseUrl();
  const url = `${base}/api/threads/${encodeURIComponent(threadId)}`;
  await fetchJson<Thread>(url, {
    method: "PATCH",
    body: JSON.stringify({ assignedTo, assignedBy }),
  });
  return getThread(projectId, pageUrl, threadId);
}

export async function deleteThread(
  projectId: string,
  pageUrl: string,
  threadId: string
): Promise<void> {
  const base = baseUrl();
  const url = `${base}/api/threads/${encodeURIComponent(threadId)}`;
  await fetchJson<void>(url, { method: "DELETE" });
}
