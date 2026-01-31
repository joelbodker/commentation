/**
 * Right-hand sidebar: thread list (pin #, snippet, status, date), thread detail with comments + reply + resolve.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Thread, ThreadListItem } from "./store";
import styles from "./Sidebar.module.css";

type ThreadWithIndex = ThreadListItem & { index: number };

/* Confetti: varied angles (drift vs fall), left %, rotation, color. Base set x3 with speed tiers. */
const CONFETTI_BASE: { left: number; fall: number; drift: number; r: number; color: string; w: number; h: number }[] = [
  { left: 5, fall: 280, drift: 55, r: 45, color: "#0d99ff", w: 5, h: 10 },
  { left: 18, fall: 380, drift: -48, r: -30, color: "#ff6b6b", w: 4, h: 9 },
  { left: 32, fall: 220, drift: 72, r: 60, color: "#ffd93d", w: 5, h: 11 },
  { left: 48, fall: 350, drift: -62, r: -15, color: "#6bcb77", w: 4, h: 8 },
  { left: 62, fall: 400, drift: 38, r: 20, color: "#9b59b6", w: 5, h: 10 },
  { left: 78, fall: 260, drift: -68, r: -50, color: "#e74c3c", w: 4, h: 9 },
  { left: 92, fall: 320, drift: 58, r: 35, color: "#3498db", w: 5, h: 10 },
  { left: 12, fall: 340, drift: -42, r: 10, color: "#f39c12", w: 4, h: 8 },
  { left: 28, fall: 240, drift: 65, r: -40, color: "#1abc9c", w: 5, h: 11 },
  { left: 55, fall: 370, drift: -55, r: 55, color: "#e91e63", w: 4, h: 9 },
  { left: 72, fall: 290, drift: 45, r: -25, color: "#0d99ff", w: 5, h: 10 },
  { left: 88, fall: 390, drift: -70, r: 70, color: "#ff6b6b", w: 4, h: 8 },
  { left: 8, fall: 355, drift: 78, r: -60, color: "#ffd93d", w: 5, h: 11 },
  { left: 42, fall: 305, drift: -35, r: 15, color: "#6bcb77", w: 4, h: 9 },
  { left: 65, fall: 230, drift: 52, r: -45, color: "#9b59b6", w: 5, h: 10 },
  { left: 85, fall: 325, drift: -58, r: 80, color: "#e74c3c", w: 4, h: 8 },
  { left: 22, fall: 365, drift: 48, r: -10, color: "#3498db", w: 5, h: 10 },
  { left: 38, fall: 275, drift: -65, r: 40, color: "#f39c12", w: 4, h: 9 },
  { left: 58, fall: 385, drift: 62, r: -70, color: "#1abc9c", w: 5, h: 11 },
  { left: 75, fall: 335, drift: -45, r: 25, color: "#e91e63", w: 4, h: 8 },
  { left: 95, fall: 310, drift: 68, r: -55, color: "#0d99ff", w: 5, h: 10 },
  { left: 15, fall: 395, drift: -52, r: 65, color: "#ff6b6b", w: 4, h: 9 },
  { left: 52, fall: 358, drift: 55, r: -35, color: "#ffd93d", w: 5, h: 10 },
  { left: 68, fall: 268, drift: -72, r: 50, color: "#6bcb77", w: 4, h: 8 },
  { left: 82, fall: 378, drift: 42, r: -20, color: "#9b59b6", w: 5, h: 11 },
];

type SpeedTier = "fast" | "normal" | "slow";
const CONFETTI_PIECES: { left: number; fall: number; drift: number; r: number; color: string; w: number; h: number; duration: number }[] = (() => {
  const out: { left: number; fall: number; drift: number; r: number; color: string; w: number; h: number; duration: number }[] = [];
  const n = CONFETTI_BASE.length;
  const driftVariation = [0.9, 1, 1.15];
  const fallVariation = [0.85, 1, 1.1];
  for (let copy = 0; copy < 3; copy++) {
    const speedTier: SpeedTier = copy === 0 ? "fast" : copy === 1 ? "normal" : "slow";
    const duration = speedTier === "fast" ? 0.7 : speedTier === "normal" ? 1.4 : 2.8;
    const d = driftVariation[copy];
    const f = fallVariation[copy];
    for (let i = 0; i < n; i++) {
      const b = CONFETTI_BASE[i];
      out.push({
        ...b,
        left: Math.max(0, Math.min(100, b.left + (copy - 1) * 3)),
        drift: Math.round(b.drift * d),
        fall: Math.round(b.fall * f),
        duration,
      });
    }
  }
  return out;
})();

function ConfettiShower({ fire }: { fire: boolean }) {
  if (!fire) return null;
  return (
    <div className={styles.confettiShower} aria-hidden>
      {CONFETTI_PIECES.map((p, i) => (
        <div
          key={i}
          className={styles.confettiPiece}
          style={
            {
              "--fall": `${p.fall}px`,
              "--drift": `${p.drift}px`,
              "--r": `${p.r}deg`,
              left: `${p.left}%`,
              width: `${p.w}px`,
              height: `${p.h}px`,
              backgroundColor: p.color,
              animationDuration: `${p.duration}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

function formatDate(s: string): string {
  const d = new Date(s);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatDateTime(s: string): string {
  const d = new Date(s);
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDuration(createdAt: string, resolvedAt: string): string {
  const a = new Date(createdAt).getTime();
  const b = new Date(resolvedAt).getTime();
  const ms = Math.max(0, b - a);
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  if (days >= 1) return `${days}d`;
  if (hours >= 1) return `${hours}h`;
  if (mins >= 1) return `${mins}m`;
  return "<1m";
}

function pagePathFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname || "/";
    return path === "" ? "/" : path;
  } catch {
    return url;
  }
}

const INBOX_SEEN_KEY = "commentation-inbox-seen";

function getInboxSeenKey(projectId: string, createdBy: string): string {
  return `${INBOX_SEEN_KEY}-${String(projectId ?? "")}-${encodeURIComponent(String(createdBy ?? ""))}`;
}

function getLastSeenAt(projectId: string, createdBy: string, threadId: string): number | null {
  try {
    const key = getInboxSeenKey(projectId, createdBy);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, number>;
    return data[threadId] ?? null;
  } catch {
    return null;
  }
}

function markThreadAsSeen(projectId: string, createdBy: string, threadId: string): void {
  try {
    const key = getInboxSeenKey(projectId, createdBy);
    const raw = localStorage.getItem(key);
    const data = (raw ? JSON.parse(raw) : {}) as Record<string, number>;
    data[threadId] = Date.now();
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function computeInboxItems(
  threads: ThreadListItem[],
  createdBy: string,
  projectId: string
): { thread: ThreadListItem; unread: boolean }[] {
  try {
    const me = (createdBy ?? "").trim() || "Anonymous";
    const items: { thread: ThreadListItem; unread: boolean }[] = [];
    for (const t of threads ?? []) {
      const comments = t.comments ?? [];
      if (comments.length === 0) continue;
      const latestComment = comments[comments.length - 1];
      if (!latestComment || (latestComment.createdBy ?? "") === me) continue;
      const iParticipated =
        (t.createdBy ?? "") === me || comments.some((c) => (c.createdBy ?? "") === me);
      if (!iParticipated) continue;
      const lastSeen = getLastSeenAt(projectId, createdBy ?? "", t.id);
      const latestTime = new Date(latestComment.createdAt ?? 0).getTime();
      const unread = lastSeen == null || lastSeen < latestTime;
      items.push({ thread: t, unread });
    }
    return items.sort((a, b) => {
      const aComments = a.thread.comments ?? [];
      const bComments = b.thread.comments ?? [];
      const aTime = aComments.length ? new Date(aComments[aComments.length - 1]?.createdAt ?? 0).getTime() : 0;
      const bTime = bComments.length ? new Date(bComments[bComments.length - 1]?.createdAt ?? 0).getTime() : 0;
      return bTime - aTime;
    });
  } catch {
    return [];
  }
}

function ThreadDetail({
  threadId,
  thread,
  threadIndex,
  createdBy,
  onRefresh,
  onBack,
  onResolved,
  onAddComment,
  onUpdateThreadStatus,
  onAssignThread,
  addLog,
  knownNames = [],
}: {
  threadId: string;
  thread: Thread | null;
  threadIndex: number;
  createdBy: string;
  onRefresh: () => void;
  onBack: () => void;
  onResolved?: () => void;
  onAddComment: (threadId: string, pageUrl: string, body: string, createdBy: string) => void | Promise<void>;
  onUpdateThreadStatus: (threadId: string, pageUrl: string, status: "OPEN" | "RESOLVED", resolvedBy?: string) => void | Promise<void>;
  onAssignThread: (threadId: string, pageUrl: string, assignedTo: string, assignedBy: string) => void | Promise<void>;
  addLog?: (msg: string) => void;
  knownNames?: string[];
}) {
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignTo, setAssignTo] = useState("");
  const [assignToCustom, setAssignToCustom] = useState("");
  const [mention, setMention] = useState<{ query: string; start: number; end: number } | null>(null);
  const [mentionHighlight, setMentionHighlight] = useState(0);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setAssignTo("");
    setAssignToCustom("");
  }, [threadId]);

  const mentionCandidates = useMemo(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    return knownNames.filter((n) => n.toLowerCase().startsWith(q));
  }, [mention, knownNames]);

  const updateMentionState = useCallback((text: string, cursor: number) => {
    const before = text.slice(0, cursor);
    const atIdx = before.lastIndexOf("@");
    if (atIdx === -1) {
      setMention(null);
      return;
    }
    const afterAt = before.slice(atIdx + 1);
    if (/[\s\n]/.test(afterAt)) {
      setMention(null);
      return;
    }
    setMention({ query: afterAt, start: atIdx, end: cursor });
    setMentionHighlight(0);
  }, []);

  const insertMention = useCallback((name: string) => {
    if (!mention || !replyTextareaRef.current) return;
    const before = reply.slice(0, mention.start);
    const after = reply.slice(mention.end);
    const newReply = before + "@" + name + " " + after;
    setReply(newReply);
    setMention(null);
    requestAnimationFrame(() => {
      const pos = mention.start + name.length + 2;
      replyTextareaRef.current?.setSelectionRange(pos, pos);
      replyTextareaRef.current?.focus();
    });
  }, [mention, reply]);

  const performReply = async () => {
    const b = reply.trim();
    const name = createdBy.trim() || "Anonymous";
    if (!b || posting || !thread) return;
    setPosting(true);
    setMention(null);
    try {
      await onAddComment(threadId, thread.pageUrl, b, name);
      addLog?.(`Reply on task #${threadIndex} by ${name}`);
      setReply("");
      onRefresh();
    } finally {
      setPosting(false);
    }
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    performReply();
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mention && mentionCandidates.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionHighlight((h) => Math.min(h + 1, mentionCandidates.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionHighlight((h) => Math.max(h - 1, 0));
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        insertMention(mentionCandidates[mentionHighlight]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMention(null);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      performReply();
    }
  };

  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setReply(v);
    updateMentionState(v, e.target.selectionStart);
  };

  const handleToggleResolved = async () => {
    if (!thread || resolving) return;
    const next = thread.status === "OPEN" ? "RESOLVED" : "OPEN";
    const name = createdBy.trim() || "Anonymous";
    setResolving(true);
    try {
      await onUpdateThreadStatus(threadId, thread.pageUrl, next, next === "RESOLVED" ? name : undefined);
      if (next === "RESOLVED") {
        addLog?.(`Task #${threadIndex} resolved by ${name}`);
        onResolved?.();
      } else {
        addLog?.(`Task #${threadIndex} reopened by ${name}`);
      }
      onRefresh();
    } finally {
      setResolving(false);
    }
  };

  const handleAssign = async () => {
    if (!thread || assigning || thread.status !== "OPEN") return;
    const assignedTo = assignTo === "__custom__" ? assignToCustom.trim() : assignTo.trim();
    const assignedBy = createdBy.trim() || "Anonymous";
    if (!assignedTo) return;
    setAssigning(true);
    try {
      await onAssignThread(threadId, thread.pageUrl, assignedTo, assignedBy);
      addLog?.(`Task #${threadIndex} assigned to ${assignedTo} by ${assignedBy}`);
      setAssignTo("");
      setAssignToCustom("");
      onRefresh();
    } finally {
      setAssigning(false);
    }
  };

  if (!thread) {
    return (
      <div className={styles.detail}>
        <button type="button" className={styles.back} onClick={onBack}>
          ← Back
        </button>
        <p className={styles.error}>Thread not found.</p>
      </div>
    );
  }

  const comments = thread.comments ?? [];
  const firstBody = comments[0]?.body ?? "";
  const snippet = firstBody.slice(0, 80) + (firstBody.length > 80 ? "…" : "");

  return (
    <div className={styles.detail}>
      <header className={styles.detailHeader}>
        <button type="button" className={styles.back} onClick={onBack} aria-label="Back to list">
          ←
        </button>
        <div className={styles.detailHeaderMain}>
          <div className={styles.detailTitleRow}>
            <span className={styles.detailPin}>#{threadIndex}</span>
            <span className={thread.status === "OPEN" ? styles.badgeOpen : styles.badgeResolved}>
              {thread.status}
            </span>
            <a href={thread.pageUrl} className={styles.detailPage} title="Go to page">
              {pagePathFromUrl(thread.pageUrl)}
            </a>
          </div>
          {snippet && <p className={styles.detailSnippet}>{snippet}</p>}
        </div>
      </header>

      <div className={styles.detailMeta}>
        <span className={styles.detailMetaItem}>
          {thread.createdBy} · {formatDateTime(thread.createdAt)}
        </span>
        {thread.assignedTo && (
          <span className={styles.detailMetaItem}>
            → {thread.assignedTo}
          </span>
        )}
        {thread.resolvedBy && thread.resolvedAt && (
          <span className={styles.detailMetaItem}>
            ✓ {thread.resolvedBy} · {formatDateTime(thread.resolvedAt)}
          </span>
        )}
      </div>

      <div className={styles.commentsList}>
        {comments.map((c) => (
          <article key={c.id} className={styles.comment}>
            <header className={styles.commentHeader}>
              <span className={styles.commentAuthor}>{c.createdBy}</span>
              <time className={styles.commentTime} dateTime={c.createdAt}>
                {formatDateTime(c.createdAt)}
              </time>
            </header>
            <div className={styles.commentBody}>{c.body}</div>
          </article>
        ))}
      </div>
      <form onSubmit={handleReply} className={styles.replyForm}>
        <div className={styles.replyInputWrap}>
          <textarea
            ref={replyTextareaRef}
            className={styles.replyInput}
            value={reply}
            onChange={handleReplyChange}
            onKeyDown={handleReplyKeyDown}
            onSelect={(e) => {
              const ta = e.currentTarget;
              updateMentionState(reply, ta.selectionStart);
            }}
            onBlur={() => setTimeout(() => setMention(null), 150)}
            placeholder="Write a reply... Type @ to mention someone"
            rows={2}
            disabled={posting}
          />
          {mention && mentionCandidates.length > 0 && (
            <ul className={styles.mentionDropdown} role="listbox">
              {mentionCandidates.map((name, i) => (
                <li
                  key={name}
                  role="option"
                  aria-selected={i === mentionHighlight}
                  className={`${styles.mentionItem} ${i === mentionHighlight ? styles.mentionItemHighlight : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(name);
                  }}
                >
                  @{name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={styles.replyRow}>
          <span className={styles.replyAs}>Replying as {createdBy.trim() || "Anonymous"}</span>
          <button type="submit" className={styles.replyBtn} disabled={!reply.trim() || posting}>
            Reply
          </button>
        </div>
      </form>
      <div className={styles.detailActions}>
        {thread.status === "OPEN" && (
          <div className={styles.assignRow}>
            <select
              className={styles.assignSelect}
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              disabled={assigning}
              aria-label="Assign to"
            >
              <option value="">Assign…</option>
              {knownNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value="__custom__">+ Add</option>
            </select>
            {assignTo === "__custom__" && (
              <input
                type="text"
                className={styles.assignCustomInput}
                value={assignToCustom}
                onChange={(e) => setAssignToCustom(e.target.value)}
                placeholder="Name"
                disabled={assigning}
                aria-label="New assignee"
              />
            )}
            <button
              type="button"
              className={styles.assignBtn}
              onClick={handleAssign}
              disabled={assigning || !(assignTo === "__custom__" ? assignToCustom.trim() : assignTo.trim())}
              title="Assign"
            >
              Assign
            </button>
          </div>
        )}
        <button
          type="button"
          className={styles.resolveBtn}
          onClick={handleToggleResolved}
          disabled={resolving}
        >
          {thread.status === "OPEN" ? "Resolve" : "Reopen"}
        </button>
      </div>
    </div>
  );
}

type ActivityLogEntry = { id: string; message: string; timestamp: string };

export function Sidebar({
  open,
  onClose,
  threads,
  selectedThreadId,
  onSelectThread,
  statusFilter,
  onStatusFilterChange,
  onHoverResolvedThread,
  onRefresh,
  loading,
  error,
  createdBy,
  onCreatedByChange,
  onPersistName,
  showNameRequiredPrompt = false,
  knownNames = [],
  projectId,
  selectedThread,
  onAddComment,
  onUpdateThreadStatus,
  onAssignThread,
  activityLog = [],
  addLog,
  onDeleteThread,
  onReorder,
  showReorder = true,
  onEnterCommentMode,
  commentMode = false,
  theme = "light",
  onThemeChange,
  onInboxUnreadChange,
}: {
  open: boolean;
  onClose: () => void;
  threads: ThreadWithIndex[];
  selectedThreadId: string | null;
  onSelectThread: (id: string) => void;
  statusFilter: "open" | "resolved";
  onStatusFilterChange: (v: "open" | "resolved") => void;
  onHoverResolvedThread: (threadId: string | null) => void;
  onRefresh: () => void;
  loading: boolean;
  error: string | null;
  createdBy: string;
  onCreatedByChange: (v: string) => void;
  onPersistName: (name: string) => void;
  showNameRequiredPrompt?: boolean;
  knownNames?: string[];
  projectId: string;
  selectedThread: Thread | null;
  onAddComment: (threadId: string, pageUrl: string, body: string, createdBy: string) => void | Promise<void>;
  onUpdateThreadStatus: (threadId: string, pageUrl: string, status: "OPEN" | "RESOLVED", resolvedBy?: string) => void | Promise<void>;
  onAssignThread: (threadId: string, pageUrl: string, assignedTo: string, assignedBy: string) => void | Promise<void>;
  activityLog?: ActivityLogEntry[];
  addLog?: (msg: string) => void;
  onDeleteThread?: (threadId: string) => void;
  onReorder?: (threadIds: string[]) => void;
  showReorder?: boolean;
  onEnterCommentMode?: () => void;
  commentMode?: boolean;
  theme?: "light" | "dark";
  onThemeChange?: (theme: "light" | "dark") => void;
  onInboxUnreadChange?: (count: number) => void;
}) {
  const [view, setView] = useState<"comments" | "inbox" | "log" | "settings">("comments");
  const [detailThreadId, setDetailThreadId] = useState<string | null>(null);
  const [nameEditing, setNameEditing] = useState(!createdBy);
  const [confettiKey, setConfettiKey] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [deletingThreadIds, setDeletingThreadIds] = useState<Set<string>>(new Set());
  const [inboxSeenVersion, setInboxSeenVersion] = useState(0);
  const prevOpenRef = useRef(false);

  const handleDeleteClick = useCallback(
    (threadId: string) => {
      // Mark as deleting to trigger animation
      setDeletingThreadIds((prev) => new Set(prev).add(threadId));
      // Wait for animation to complete before actually deleting
      setTimeout(() => {
        onDeleteThread?.(threadId);
        setDeletingThreadIds((prev) => {
          const next = new Set(prev);
          next.delete(threadId);
          return next;
        });
      }, 300); // Match animation duration (0.3s)
    },
    [onDeleteThread]
  );

  useEffect(() => {
    if (confettiKey === 0) return;
    const t = setTimeout(() => setConfettiKey(0), 5500);
    return () => clearTimeout(t);
  }, [confettiKey]);

  useEffect(() => {
    if (selectedThreadId) setDetailThreadId(selectedThreadId);
  }, [selectedThreadId]);

  // When opening the sidebar, always default to Tasks (comments view, not a thread).
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setDetailThreadId(null);
      setView("comments");
    }
    prevOpenRef.current = open;
  }, [open]);

  const showDetail = detailThreadId != null;
  const showNameLocked = !nameEditing && !showNameRequiredPrompt;

  const safeThreads = Array.isArray(threads) ? threads : [];
  const inboxItems = useMemo(
    () => computeInboxItems(safeThreads, createdBy ?? "", projectId ?? ""),
    [safeThreads, createdBy, projectId, inboxSeenVersion]
  );
  const inboxUnreadCount = inboxItems.filter((x) => x.unread).length;

  const handleOpenThread = useCallback(
    (threadId: string) => {
      onSelectThread(threadId);
      setDetailThreadId(threadId);
      setView("comments");
      if (createdBy.trim()) {
        markThreadAsSeen(projectId, createdBy, threadId);
        setInboxSeenVersion((v) => v + 1);
      }
    },
    [onSelectThread, createdBy, projectId]
  );

  useEffect(() => {
    if (detailThreadId && createdBy.trim()) {
      markThreadAsSeen(projectId, createdBy, detailThreadId);
      setInboxSeenVersion((v) => v + 1);
    }
  }, [detailThreadId, createdBy, projectId]);

  useEffect(() => {
    onInboxUnreadChange?.(inboxUnreadCount);
  }, [inboxUnreadCount, onInboxUnreadChange]);

  return (
    <aside
      className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}
      style={{ pointerEvents: open ? "auto" : "none" }}
      data-fig-comments-sidebar
      data-theme={theme}
    >
      <div className={styles.sidebarPanel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Commentation</h2>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={`${styles.headerIconBtn} ${view === "inbox" ? styles.headerIconActive : ""} ${styles.headerIconInbox}`}
              onClick={() => setView(view === "inbox" ? "comments" : "inbox")}
              aria-label="Inbox"
              title={inboxUnreadCount > 0 ? `${inboxUnreadCount} new reply${inboxUnreadCount === 1 ? "" : "ies"}` : "Replies to you"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
              {inboxUnreadCount > 0 && (
                <span className={styles.inboxDot} aria-hidden />
              )}
            </button>
            <button
              type="button"
              className={`${styles.headerIconBtn} ${view === "log" ? styles.headerIconActive : ""}`}
              onClick={() => setView(view === "log" ? "comments" : "log")}
              aria-label="Log"
              title="Activity log"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.headerIconBtn} ${view === "settings" ? styles.headerIconActive : ""}`}
              onClick={() => setView(view === "settings" ? "comments" : "settings")}
              aria-label="Settings"
              title="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <button type="button" className={styles.headerIconBtn} onClick={onClose} aria-label="Close" title="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {view === "inbox" && (
          <div className={styles.inboxView}>
            <p className={styles.inboxViewTitle}>Replies to you</p>
            {!createdBy.trim() ? (
              <p className={styles.inboxEmpty}>Enter your name in Settings to see replies.</p>
            ) : inboxItems.length === 0 ? (
              <p className={styles.inboxEmpty}>No new replies.</p>
            ) : (
              <ul className={styles.inboxList}>
                {inboxItems.map(({ thread, unread }) => {
                  const comments = thread.comments ?? [];
                  const latest = comments[comments.length - 1];
                  return (
                    <li key={thread.id} className={styles.inboxItem}>
                      <button
                        type="button"
                        className={`${styles.inboxItemBtn} ${unread ? styles.inboxItemUnread : ""}`}
                        onClick={() => handleOpenThread(thread.id)}
                      >
                        <span className={styles.inboxItemFrom}>{latest.createdBy}</span>
                        <span className={styles.inboxItemSnippet}>
                          {(latest.body ?? "").slice(0, 80)}
                          {(latest.body ?? "").length > 80 ? "…" : ""}
                        </span>
                        <span className={styles.inboxItemMeta}>
                          {pagePathFromUrl(thread.pageUrl)} · {formatDate(latest.createdAt)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {view === "log" && (
          <div className={styles.logView}>
            <p className={styles.logViewTitle}>Activity log</p>
            <ul className={styles.logList}>
              {activityLog.length === 0 ? (
                <li className={styles.logEmpty}>No activity yet.</li>
              ) : (
                [...activityLog].reverse().map((entry) => (
                  <li key={entry.id} className={styles.logEntry}>
                    <span className={styles.logTime}>{formatDateTime(entry.timestamp)}</span>
                    <span className={styles.logMessage}>{entry.message}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {view === "settings" && (
          <div className={styles.settingsView}>
            <p className={styles.settingsLabel}>Theme</p>
            <div className={styles.settingsThemeRow} role="group" aria-label="App theme">
              <button
                type="button"
                className={`${styles.settingsThemeBtn} ${theme === "light" ? styles.settingsThemeBtnSelected : ""}`}
                onClick={() => onThemeChange?.("light")}
                aria-pressed={theme === "light"}
              >
                Light
              </button>
              <button
                type="button"
                className={`${styles.settingsThemeBtn} ${theme === "dark" ? styles.settingsThemeBtnSelected : ""}`}
                onClick={() => onThemeChange?.("dark")}
                aria-pressed={theme === "dark"}
              >
                Dark
              </button>
            </div>
          </div>
        )}

        {view === "comments" && (
          <>
        {/* Your name: lock in with checkmark, persists to localStorage; Edit to change. */}
        <div className={styles.nameRow}>
          {showNameRequiredPrompt && (
            <div className={styles.nameRequiredTooltip} role="alert">
              You must enter your name to create a comment.
            </div>
          )}
          {showNameLocked ? (
            <>
              <span className={styles.nameLabel}>Your name</span>
              <div className={styles.nameLocked}>
                <span className={styles.nameValue}>{createdBy}</span>
                <button
                  type="button"
                  className={styles.nameEditBtn}
                  onClick={() => setNameEditing(true)}
                  aria-label="Edit name"
                >
                  Edit
                </button>
              </div>
            </>
          ) : (
            <>
              <label className={styles.nameLabel} htmlFor="fig-comments-your-name">
                Your name
              </label>
              <div className={`${styles.nameInputRow} ${showNameRequiredPrompt ? styles.nameInputRowHighlight : ""}`}>
                <input
                  id="fig-comments-your-name"
                  type="text"
                  className={styles.nameInput}
                  value={createdBy}
                  onChange={(e) => onCreatedByChange(e.target.value)}
                  placeholder="Name or email"
                />
                <button
                  type="button"
                  className={styles.nameOkBtn}
                  onClick={() => {
                    onPersistName(createdBy.trim());
                    setNameEditing(false);
                  }}
                  aria-label="Save name"
                  title="Save name"
                >
                  ✓
                </button>
              </div>
            </>
          )}
        </div>

        {showDetail ? (
          <ThreadDetail
            threadId={detailThreadId!}
            thread={selectedThread}
            threadIndex={safeThreads.find((t) => t.id === detailThreadId)?.index ?? 0}
            createdBy={createdBy}
            onRefresh={onRefresh}
            onBack={() => setDetailThreadId(null)}
            onResolved={() => {
              setDetailThreadId(null);
              onStatusFilterChange("open");
              setConfettiKey((k) => k + 1);
            }}
            onAddComment={onAddComment}
            onUpdateThreadStatus={onUpdateThreadStatus}
            onAssignThread={onAssignThread}
            addLog={addLog}
            knownNames={knownNames}
          />
        ) : (
          <>
            <div className={styles.toolbar}>
              <div className={styles.pillSlider} role="tablist" aria-label="Tasks or Resolved">
                <div
                  className={styles.pillSliderTrack}
                  style={{ transform: statusFilter === "open" ? "translateX(0)" : "translateX(100%)" }}
                  aria-hidden
                />
                <button
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === "open"}
                  className={`${styles.pill} ${statusFilter === "open" ? styles.pillSelected : ""}`}
                  onClick={() => onStatusFilterChange("open")}
                >
                  Tasks
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === "resolved"}
                  className={`${styles.pill} ${statusFilter === "resolved" ? styles.pillSelected : ""}`}
                  onClick={() => onStatusFilterChange("resolved")}
                >
                  Resolved
                </button>
              </div>
              <div className={styles.toolbarActions}>
                <button type="button" className={styles.refresh} onClick={onRefresh} title="Refresh">
                  ↻
                </button>
              </div>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            {loading ? (
              <p className={styles.loading}>
                {statusFilter === "open" ? "Loading tasks…" : "Loading resolved…"}
              </p>
            ) : safeThreads.length === 0 ? (
              <p className={styles.empty}>
                {statusFilter === "open"
                  ? "No tasks yet. Turn on comment mode and click the page."
                  : "No resolved tasks."}
              </p>
            ) : (
              <ul className={styles.list}>
                {safeThreads.map((t, i) => (
                  <li
                    key={t.id}
                    className={`${styles.listItem} ${dropIndex === i ? styles.listItemDropTarget : ""} ${dragIndex === i ? styles.listItemDragging : ""} ${deletingThreadIds.has(t.id) ? styles.listItemDeleting : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDropIndex(i);
                    }}
                    onDragLeave={() => setDropIndex(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragIndex == null || !onReorder) return;
                      const ids = safeThreads.map((x) => x.id);
                      const [removed] = ids.splice(dragIndex, 1);
                      ids.splice(i, 0, removed);
                      onReorder(ids);
                      setDragIndex(null);
                      setDropIndex(null);
                    }}
                  >
                    <div className={styles.itemRow}>
                      <button
                        type="button"
                        className={`${styles.item} ${styles.itemCard} ${i % 2 === 0 ? styles.itemPastelBlue : styles.itemPastelGreen} ${t.id === detailThreadId ? styles.itemSelected : ""}`}
                        onClick={() => {
                          onSelectThread(t.id);
                          setDetailThreadId(t.id);
                        }}
                        onMouseEnter={() => statusFilter === "resolved" && onHoverResolvedThread(t.id)}
                        onMouseLeave={() => statusFilter === "resolved" && onHoverResolvedThread(null)}
                      >
                        <span className={styles.pinBadge}>{t.index}</span>
                        {t.assignedTo === (createdBy ?? "").trim() &&
                          createdBy.trim() &&
                          getLastSeenAt(projectId ?? "", createdBy ?? "", t.id) == null && (
                            <span className={styles.taskNewDot} aria-label="New task" />
                          )}
                        <div className={styles.itemBody}>
                          <span className={t.status === "OPEN" ? styles.badgeOpen : styles.badgeResolved}>
                            {t.status}
                          </span>
                          <span className={styles.itemPage} title={t.pageUrl}>
                            {pagePathFromUrl(t.pageUrl)}
                          </span>
                          <span className={styles.itemSnippet}>
                            {(t.latestComment?.body ?? "").slice(0, 60)}
                            {((t.latestComment?.body ?? "").length > 60 ? "…" : "")}
                          </span>
                          <span className={styles.itemDate}>
                            {t.status === "OPEN" ? formatDate(t.createdAt) : `Created ${formatDateTime(t.createdAt)}`}
                            {t.assignedTo && `  •  Assigned to: ${t.assignedTo}`}
                          </span>
                          {t.status === "RESOLVED" && t.resolvedBy && t.resolvedAt && (
                            <span className={styles.itemResolvedMeta}>
                              Resolved {formatDateTime(t.resolvedAt)} by {t.resolvedBy}
                              {t.createdAt && ` · Duration ${formatDuration(t.createdAt, t.resolvedAt)}`}
                            </span>
                          )}
                        </div>
                      </button>
                      {onReorder && showReorder && (
                        <span
                          role="button"
                          tabIndex={0}
                          className={styles.dragHandle}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", t.id);
                            setDragIndex(i);
                          }}
                          onDragEnd={() => {
                            setDragIndex(null);
                            setDropIndex(null);
                          }}
                          title="Drag to reorder"
                          aria-label="Drag to reorder"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                          </svg>
                        </span>
                      )}
                      {statusFilter === "resolved" && onDeleteThread && (
                        <button
                          type="button"
                          className={styles.itemTrashBtn}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteClick(t.id);
                          }}
                          title="Delete this resolved comment"
                          aria-label="Delete this comment"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
          </>
        )}
        {confettiKey > 0 && <ConfettiShower key={confettiKey} fire />}
      </div>
    </aside>
  );
}
