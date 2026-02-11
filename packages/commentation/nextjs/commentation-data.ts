/**
 * Commentation data layer — read/write .commentation/data.json.
 * Used by the Next.js API route (mirrors the Vite plugin behavior).
 * Copy to your app (e.g. lib/commentation-data.ts) and update the route import.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";

const DATA_FILE = ".commentation/data.json";

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

export type PageData = {
  threads: Thread[];
  order: string[];
};

export type ActivityLogEntry = {
  id: string;
  threadId: string | null;
  type: string;
  message: string;
  timestamp: string;
  meta?: Record<string, unknown>;
};

export type DataFile = {
  projects: Record<string, Record<string, PageData>>;
  activityLog?: ActivityLogEntry[];
};

export function id(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function getDataPath(root: string): string {
  return join(root, DATA_FILE);
}

export function loadData(root: string): DataFile {
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

export function saveData(root: string, data: DataFile): void {
  const path = getDataPath(root);
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}

export function findThread(
  data: DataFile,
  threadId: string
): { thread: Thread; projectId: string; pageUrl: string } | null {
  for (const [projectId, pages] of Object.entries(data.projects)) {
    for (const [pageUrl, pageData] of Object.entries(pages)) {
      const thread = pageData.threads.find((t) => t.id === threadId);
      if (thread) return { thread, projectId, pageUrl };
    }
  }
  return null;
}

export function getPageData(
  data: DataFile,
  projectId: string,
  pageUrl: string
): PageData {
  if (!data.projects[projectId]) data.projects[projectId] = {};
  if (!data.projects[projectId][pageUrl]) {
    data.projects[projectId][pageUrl] = { threads: [], order: [] };
  }
  return data.projects[projectId][pageUrl];
}
