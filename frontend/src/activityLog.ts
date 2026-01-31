/**
 * Activity log types and utilities for comprehensive per-thread event tracking.
 */

export type LogEventType =
  | "created"
  | "viewed"
  | "closed"
  | "reply"
  | "resolved"
  | "reopened"
  | "assigned"
  | "deleted"
  | "reordered"
  | "comment_mode_entered"
  | "comment_mode_exited"
  | "name_saved"
  | "refresh"
  | "generic";

export type ActivityLogEntry = {
  id: string;
  threadId: string | null;
  type: LogEventType;
  message: string;
  timestamp: string;
  meta?: {
    createdBy?: string;
    assignedTo?: string;
    assignedBy?: string;
    resolvedBy?: string;
    bodyPreview?: string;
    threadIndex?: number;
    pageUrl?: string;
    closedBy?: string;
  };
};

export type AddLogFn = (
  message: string,
  options?: { threadId?: string; type?: LogEventType; meta?: ActivityLogEntry["meta"] }
) => void;

export function getEntriesByThread(entries: ActivityLogEntry[]): Map<string | null, ActivityLogEntry[]> {
  const byThread = new Map<string | null, ActivityLogEntry[]>();
  for (const e of entries) {
    const tid = e.threadId ?? null;
    const list = byThread.get(tid) ?? [];
    list.push(e);
    byThread.set(tid, list);
  }
  for (const list of byThread.values()) {
    list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  return byThread;
}

export function getThreadIdsWithActivity(entries: ActivityLogEntry[]): string[] {
  const ids = new Set<string>();
  for (const e of entries) {
    if (e.threadId) ids.add(e.threadId);
  }
  return Array.from(ids);
}
