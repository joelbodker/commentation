/**
 * Typed API client for the comments backend.
 * All methods use backendUrl and projectId from config.
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
  comments?: Comment[];
};

export type ThreadListItem = Thread & {
  latestComment: Comment | null;
  commentCount: number;
};

export type CreateThreadBody = {
  pageUrl: string;
  selector: string;
  xPercent: number;
  yPercent: number;
  body: string;
  createdBy: string;
};

export type AddCommentBody = {
  body: string;
  createdBy: string;
};

function base(url: string, path: string, init?: RequestInit): Promise<Response> {
  const u = `${url.replace(/\/$/, "")}${path}`;
  return fetch(u, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
}

export async function listThreads(
  backendUrl: string,
  projectId: string,
  pageUrl: string,
  includeResolved = false
): Promise<ThreadListItem[]> {
  const params = new URLSearchParams({ pageUrl });
  if (includeResolved) params.set("includeResolved", "true");
  const res = await base(
    backendUrl,
    `/api/projects/${encodeURIComponent(projectId)}/threads?${params}`,
    { method: "GET" }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getThread(
  backendUrl: string,
  threadId: string
): Promise<Thread> {
  const res = await base(backendUrl, `/api/threads/${encodeURIComponent(threadId)}`, {
    method: "GET",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createThread(
  backendUrl: string,
  projectId: string,
  body: CreateThreadBody
): Promise<Thread> {
  const res = await base(
    backendUrl,
    `/api/projects/${encodeURIComponent(projectId)}/threads`,
    { method: "POST", body: JSON.stringify(body) }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addComment(
  backendUrl: string,
  threadId: string,
  body: AddCommentBody
): Promise<Comment> {
  const res = await base(backendUrl, `/api/threads/${encodeURIComponent(threadId)}/comments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateThreadStatus(
  backendUrl: string,
  threadId: string,
  status: "OPEN" | "RESOLVED"
): Promise<Thread> {
  const res = await base(backendUrl, `/api/threads/${encodeURIComponent(threadId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
