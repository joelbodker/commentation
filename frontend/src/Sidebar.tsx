/**
 * Right-hand sidebar: thread list (pin #, snippet, status, date), thread detail with comments + reply + resolve.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  getThread,
  addComment,
  updateThreadStatus,
  type Thread,
  type ThreadListItem,
  type Comment,
} from "./api";
import styles from "./Sidebar.module.css";

type ThreadWithIndex = ThreadListItem & { index: number };

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

function ThreadDetail({
  threadId,
  backendUrl,
  createdBy,
  onCreatedByChange,
  onRefresh,
  onBack,
}: {
  threadId: string;
  backendUrl: string;
  createdBy: string;
  onCreatedByChange: (v: string) => void;
  onRefresh: () => void;
  onBack: () => void;
}) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [resolving, setResolving] = useState(false);

  const load = useCallback(async () => {
    try {
      const t = await getThread(backendUrl, threadId);
      setThread(t);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, threadId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const b = reply.trim();
    const name = createdBy.trim() || "Anonymous";
    if (!b || posting) return;
    setPosting(true);
    try {
      await addComment(backendUrl, threadId, { body: b, createdBy: name });
      setReply("");
      await load();
      onRefresh();
    } finally {
      setPosting(false);
    }
  };

  const handleToggleResolved = async () => {
    if (!thread || resolving) return;
    const next = thread.status === "OPEN" ? "RESOLVED" : "OPEN";
    setResolving(true);
    try {
      const updated = await updateThreadStatus(backendUrl, threadId, next);
      setThread(updated);
      onRefresh();
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.detail}>
        <button type="button" className={styles.back} onClick={onBack}>
          ← Back
        </button>
        <p className={styles.loading}>Loading…</p>
      </div>
    );
  }
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

  return (
    <div className={styles.detail}>
      <button type="button" className={styles.back} onClick={onBack}>
        ← Back
      </button>
      <div className={styles.detailMeta}>
        <span className={thread.status === "OPEN" ? styles.badgeOpen : styles.badgeResolved}>
          {thread.status}
        </span>
        <span className={styles.detailDate}>{formatDate(thread.createdAt)}</span>
      </div>
      <div className={styles.commentsList}>
        {comments.map((c) => (
          <div key={c.id} className={styles.comment}>
            <div className={styles.commentMeta}>
              <strong>{c.createdBy}</strong> · {formatDate(c.createdAt)}
            </div>
            <div className={styles.commentBody}>{c.body}</div>
          </div>
        ))}
      </div>
      <form onSubmit={handleReply} className={styles.replyForm}>
        <textarea
          className={styles.replyInput}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write a reply..."
          rows={2}
          disabled={posting}
        />
        <div className={styles.replyRow}>
          <input
            type="text"
            className={styles.createdByInput}
            value={createdBy}
            onChange={(e) => onCreatedByChange(e.target.value)}
            placeholder="Your name"
          />
          <button type="submit" className={styles.replyBtn} disabled={!reply.trim() || posting}>
            Reply
          </button>
        </div>
      </form>
      <button
        type="button"
        className={styles.resolveBtn}
        onClick={handleToggleResolved}
        disabled={resolving}
      >
        {thread.status === "OPEN" ? "Resolve" : "Reopen"}
      </button>
    </div>
  );
}

export function Sidebar({
  open,
  onClose,
  threads,
  selectedThreadId,
  onSelectThread,
  includeResolved,
  onIncludeResolvedChange,
  onRefresh,
  loading,
  error,
  createdBy,
  onCreatedByChange,
  backendUrl,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  threads: ThreadWithIndex[];
  selectedThreadId: string | null;
  onSelectThread: (id: string) => void;
  includeResolved: boolean;
  onIncludeResolvedChange: (v: boolean) => void;
  onRefresh: () => void;
  loading: boolean;
  error: string | null;
  createdBy: string;
  onCreatedByChange: (v: string) => void;
  backendUrl: string;
  projectId: string;
}) {
  const [detailThreadId, setDetailThreadId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedThreadId) setDetailThreadId(selectedThreadId);
  }, [selectedThreadId]);

  const showDetail = detailThreadId != null;

  return (
    <aside
      className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}
      style={{ pointerEvents: open ? "auto" : "none" }}
    >
      <div className={styles.sidebarPanel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Comments</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {showDetail ? (
          <ThreadDetail
            threadId={detailThreadId}
            backendUrl={backendUrl}
            createdBy={createdBy}
            onCreatedByChange={onCreatedByChange}
            onRefresh={onRefresh}
            onBack={() => setDetailThreadId(null)}
          />
        ) : (
          <>
            <div className={styles.toolbar}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={includeResolved}
                  onChange={(e) => onIncludeResolvedChange(e.target.checked)}
                />
                Show resolved
              </label>
              <button type="button" className={styles.refresh} onClick={onRefresh} title="Refresh">
                ↻
              </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            {loading ? (
              <p className={styles.loading}>Loading threads…</p>
            ) : threads.length === 0 ? (
              <p className={styles.empty}>No threads yet. Turn on comment mode and click the page.</p>
            ) : (
              <ul className={styles.list}>
                {threads.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      className={`${styles.item} ${t.id === selectedThreadId ? styles.itemSelected : ""}`}
                      onClick={() => {
                        onSelectThread(t.id);
                        setDetailThreadId(t.id);
                      }}
                    >
                      <span className={styles.pinBadge}>{t.index}</span>
                      <div className={styles.itemBody}>
                        <span className={t.status === "OPEN" ? styles.badgeOpen : styles.badgeResolved}>
                          {t.status}
                        </span>
                        <span className={styles.itemSnippet}>
                          {(t.latestComment?.body ?? "").slice(0, 60)}
                          {((t.latestComment?.body ?? "").length > 60 ? "…" : "")}
                        </span>
                        <span className={styles.itemDate}>{formatDate(t.createdAt)}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
