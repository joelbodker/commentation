/**
 * Unified data source: uses API (Vite plugin) when available, otherwise in-memory store.
 * All operations are async for consistency.
 */
import * as api from "./api";
import * as store from "./store";
import type { Thread, ThreadListItem } from "./store";

let useApi: boolean | null = null;

async function init(): Promise<boolean> {
  if (useApi !== null) return useApi;
  useApi = await api.checkAvailable();
  return useApi;
}

export async function ensureReady(): Promise<boolean> {
  return init();
}

export async function getThreads(
  projectId: string,
  pageUrl: string | null,
  statusFilter: "open" | "resolved" | "all"
): Promise<ThreadListItem[]> {
  await init();
  if (useApi) {
    return api.getThreads(projectId, pageUrl, statusFilter);
  }
  return Promise.resolve(store.getThreads(projectId, pageUrl, statusFilter));
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
  await init();
  if (useApi) {
    return api.createThread(projectId, pageUrl, params);
  }
  return Promise.resolve(store.createThread(projectId, pageUrl, params));
}

export async function getThread(
  projectId: string,
  pageUrl: string | null,
  threadId: string
): Promise<Thread | null> {
  await init();
  if (useApi) {
    return api.getThread(projectId, pageUrl, threadId);
  }
  return Promise.resolve(store.getThread(projectId, pageUrl, threadId));
}

export async function addComment(
  projectId: string,
  pageUrl: string,
  threadId: string,
  body: string,
  createdBy: string
): Promise<Thread | null> {
  await init();
  if (useApi) {
    return api.addComment(projectId, pageUrl, threadId, body, createdBy);
  }
  const t = store.addComment(projectId, pageUrl, threadId, body, createdBy);
  return Promise.resolve(t);
}

export async function updateThreadStatus(
  projectId: string,
  pageUrl: string,
  threadId: string,
  status: "OPEN" | "RESOLVED",
  resolvedBy?: string
): Promise<Thread | null> {
  await init();
  if (useApi) {
    return api.updateThreadStatus(projectId, pageUrl, threadId, status, resolvedBy);
  }
  const t = store.updateThreadStatus(projectId, pageUrl, threadId, status, resolvedBy);
  return Promise.resolve(t);
}

export async function assignThread(
  projectId: string,
  pageUrl: string,
  threadId: string,
  assignedTo: string,
  assignedBy: string
): Promise<Thread | null> {
  await init();
  if (useApi) {
    return api.assignThread(projectId, pageUrl, threadId, assignedTo, assignedBy);
  }
  const t = store.assignThread(projectId, pageUrl, threadId, assignedTo, assignedBy);
  return Promise.resolve(t);
}

export async function deleteThread(
  projectId: string,
  pageUrl: string,
  threadId: string
): Promise<void> {
  await init();
  if (useApi) {
    return api.deleteThread(projectId, pageUrl, threadId);
  }
  store.deleteThread(projectId, pageUrl, threadId);
  return Promise.resolve();
}
