/**
 * Top-level overlay: floating button, pins layer, sidebar, comment mode, and modal composer.
 * State: commentMode, sidebarOpen, selectedThreadId, pendingPin (click position for new thread).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfigProvider, useConfig } from "./config";
import * as store from "./store";
import type { ThreadListItem } from "./store";
import { scrollToPinY, buildSelector, eventToPercent } from "./anchoring";
import { PinsLayer } from "./PinsLayer";
import { Sidebar } from "./Sidebar";
import { CommentComposer } from "./CommentComposer";
import styles from "./Overlay.module.css";

const NAME_STORAGE_KEY_PREFIX = "fig-comments-name-";
const THEME_STORAGE_KEY = "commentation-theme";
const ORDER_STORAGE_KEY_PREFIX = "commentation-order-";

function orderKey(projectId: string, pageUrl: string): string {
  return `${ORDER_STORAGE_KEY_PREFIX}${projectId}-${pageUrl.length}-${pageUrl.slice(0, 120)}`;
}

function applyOrder<T extends { id: string }>(items: T[], orderIds: string[]): T[] {
  const byId = new Map(items.map((t) => [t.id, t]));
  const ordered = orderIds.map((id) => byId.get(id)).filter(Boolean) as T[];
  const rest = items.filter((t) => !orderIds.includes(t.id));
  return [...ordered, ...rest];
}

export type Theme = "light" | "dark";

function OverlayInner() {
  const { projectId } = useConfig();
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return stored === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<"open" | "resolved">("open");
  const [commentMode, setCommentMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number; selector: string } | null>(null);
  const [hoveredResolvedThreadId, setHoveredResolvedThreadId] = useState<string | null>(null);
  const [createdBy, setCreatedBy] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem(NAME_STORAGE_KEY_PREFIX + projectId) ?? "";
    } catch {
      return "";
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<{ id: string; message: string; timestamp: string }[]>([]);
  const [taskOrder, setTaskOrder] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const pageUrl = window.location.href;
      const key = orderKey(projectId, pageUrl);
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  });
  const logIdRef = useRef(0);

  const addLog = useCallback((message: string) => {
    const id = `log-${++logIdRef.current}`;
    const timestamp = new Date().toISOString();
    setActivityLog((prev) => [...prev.slice(-99), { id, message, timestamp }]);
  }, []);

  const persistName = useCallback(
    (name: string) => {
      try {
        localStorage.setItem(NAME_STORAGE_KEY_PREFIX + projectId, name);
      } catch {
        /* ignore */
      }
      setCreatedBy(name);
      // If they were waiting to place a comment, close sidebar so the composer appears at the click.
      if (pendingPin) setSidebarOpen(false);
    },
    [projectId, pendingPin]
  );

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    const key = orderKey(projectId, pageUrl);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      const ids = Array.isArray(parsed) ? parsed.filter((x: unknown): x is string => typeof x === "string") : [];
      setTaskOrder(ids);
    } catch {
      /* ignore */
    }
  }, [projectId, pageUrl]);

  const fetchThreads = useCallback(() => {
    setError(null);
    setThreads(store.getThreads(projectId, pageUrl, statusFilter));
    setLoading(false);
  }, [projectId, pageUrl, statusFilter]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handlePageClick = useCallback(
    (e: MouseEvent) => {
      if (!commentMode || pendingPin) return;
      const target = e.target as Node;
      const root = document.getElementById("fig-comments-root");
      if (root?.contains(target)) return;
      // Sidebar can end up “under” the pins layer for hit-testing; exclude its region so
      // clicking Tasks/Resolved etc. never creates a pin.
      const sidebar = document.querySelector("[data-fig-comments-sidebar]");
      if (sidebar) {
        const rect = sidebar.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          return;
        }
      }
      const el = e.target as Element;
      const selector = buildSelector(el);
      const { xPercent, yPercent } = eventToPercent(e);
      setPendingPin({
        x: (xPercent / 100) * window.innerWidth,
        y: (yPercent / 100) * window.innerHeight,
        selector,
      });
      // If name isn't saved, open sidebar so they can enter it; composer shows after they save.
      if (!createdBy.trim()) setSidebarOpen(true);
    },
    [commentMode, pendingPin, createdBy]
  );

  useEffect(() => {
    if (!commentMode) return;
    window.addEventListener("click", handlePageClick);
    return () => window.removeEventListener("click", handlePageClick);
  }, [commentMode, handlePageClick]);

  // Figma-style: show crosshair cursor when in comment mode so it's obvious you're placing a pin.
  useEffect(() => {
    if (!commentMode) {
      document.body.style.cursor = "";
      return;
    }
    const prev = document.body.style.cursor;
    document.body.style.cursor = "crosshair";
    return () => {
      document.body.style.cursor = prev;
    };
  }, [commentMode]);

  const handleComposerCancel = useCallback(() => {
    setPendingPin(null);
    setCommentMode(false); // One comment per activation; click comment again to add another.
  }, []);

  const handleComposerPost = useCallback(
    (body: string, name: string) => {
      if (!pendingPin) return;
      const xPercent = (pendingPin.x / window.innerWidth) * 100;
      const yPercent = (pendingPin.y / window.innerHeight) * 100;
      const thread = store.createThread(projectId, pageUrl, {
        selector: pendingPin.selector,
        xPercent,
        yPercent,
        body,
        createdBy: name,
      });
      setThreads(store.getThreads(projectId, pageUrl, statusFilter));
      setPendingPin(null);
      setSelectedThreadId(thread.id);
      setCommentMode(false);
      addLog(`Task created by ${name}`);
    },
    [projectId, pageUrl, statusFilter, pendingPin, addLog]
  );

  const handleSelectThread = useCallback((id: string) => {
    setSelectedThreadId(id);
    setSidebarOpen(true);
    const t = threads.find((x) => x.id === id);
    if (t) scrollToPinY(t.yPercent);
  }, [threads]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchThreads();
  }, [fetchThreads]);

  const handleDeleteThread = useCallback(
    (threadId: string) => {
      const t = threads.find((x) => x.id === threadId);
      const openList = threads.filter((x) => x.status === "OPEN");
      const idx = t && openList.length ? openList.findIndex((x) => x.id === threadId) + 1 : null;
      addLog(
        idx != null
          ? `Task #${idx} deleted by ${createdBy.trim() || "Anonymous"}`
          : `Task deleted by ${createdBy.trim() || "Anonymous"}`
      );
      store.deleteThread(projectId, pageUrl, threadId);
      setThreads(store.getThreads(projectId, pageUrl, statusFilter));
    },
    [projectId, pageUrl, statusFilter, threads, createdBy, addLog]
  );

  const getThread = useCallback(
    (threadId: string) => store.getThread(projectId, pageUrl, threadId),
    [projectId, pageUrl]
  );

  const handleAddComment = useCallback(
    (threadId: string, body: string, createdBy: string) => {
      store.addComment(projectId, pageUrl, threadId, body, createdBy);
      setThreads(store.getThreads(projectId, pageUrl, statusFilter));
    },
    [projectId, pageUrl, statusFilter]
  );

  const handleUpdateThreadStatus = useCallback(
    (threadId: string, status: "OPEN" | "RESOLVED", resolvedBy?: string) => {
      store.updateThreadStatus(projectId, pageUrl, threadId, status, resolvedBy);
      setThreads(store.getThreads(projectId, pageUrl, statusFilter));
    },
    [projectId, pageUrl, statusFilter]
  );

  const handleAssignThread = useCallback(
    (threadId: string, assignedTo: string, assignedBy: string) => {
      store.assignThread(projectId, pageUrl, threadId, assignedTo, assignedBy);
      setThreads(store.getThreads(projectId, pageUrl, statusFilter));
    },
    [projectId, pageUrl, statusFilter]
  );

  const handleReorder = useCallback(
    (threadIds: string[]) => {
      setTaskOrder((prev) => {
        const next = [...threadIds, ...prev.filter((id) => !threadIds.includes(id))];
        try {
          localStorage.setItem(orderKey(projectId, pageUrl), JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [projectId, pageUrl]
  );

  const numberedThreads = useMemo(() => {
    const filter = statusFilter === "open" ? "OPEN" : "RESOLVED";
    const filtered = threads.filter((t) => t.status === filter);
    const withOrder = applyOrder(filtered, taskOrder);
    const assignedFirst =
      statusFilter === "open" && createdBy.trim()
        ? [...withOrder].sort((a, b) => {
            const aMe = a.assignedTo === createdBy.trim();
            const bMe = b.assignedTo === createdBy.trim();
            if (aMe && !bMe) return -1;
            if (!aMe && bMe) return 1;
            if (aMe && bMe)
              return new Date(b.assignedAt ?? 0).getTime() - new Date(a.assignedAt ?? 0).getTime();
            return 0;
          })
        : withOrder;
    return assignedFirst.map((t, i) => ({ ...t, index: i + 1 }));
  }, [threads, statusFilter, taskOrder, createdBy]);
  const openThreadsForPins = threads
    .filter((t) => t.status === "OPEN")
    .map((t, i) => ({ ...t, index: i + 1 }));
  const hoveredResolvedThread = hoveredResolvedThreadId
    ? threads.find((t) => t.id === hoveredResolvedThreadId)
    : null;

  const handleThemeChange = useCallback((next: Theme) => {
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    return () => document.body.removeAttribute("data-theme");
  }, [theme]);

  return (
    <div className={styles.wrapper} data-theme={theme}>
      <div className={styles.pageThemeSwitch} aria-label="Page theme">
        <button
          type="button"
          className={styles.pageThemeToggle}
          onClick={() => handleThemeChange(theme === "light" ? "dark" : "light")}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          <span className={theme === "light" ? styles.pageThemeIconOn : styles.pageThemeIconOff} aria-hidden>
            ☀
          </span>
          <span className={theme === "dark" ? styles.pageThemeIconOn : styles.pageThemeIconOff} aria-hidden>
            ☽
          </span>
        </button>
      </div>
      <div className={styles.pinsLayer} aria-hidden>
        <PinsLayer
          threads={openThreadsForPins}
          selectedThreadId={selectedThreadId}
          onSelect={handleSelectThread}
        />
      </div>
      {/* When hovering a resolved task in the sidebar, show a dot at its original pin location. */}
      {hoveredResolvedThread && statusFilter === "resolved" && (
        <div
          className={styles.resolvedHoverDot}
          style={{
            left: `${hoveredResolvedThread.xPercent}vw`,
            top: `${hoveredResolvedThread.yPercent}vh`,
          }}
          aria-hidden
        />
      )}

      <div className={styles.pillboxFab} aria-label="Commentation">
        <button
          type="button"
          className={`${styles.pillboxBtn} ${styles.pillboxBtnComment} ${commentMode ? styles.pillboxBtnActive : ""}`}
          onClick={() => setCommentMode((c) => !c)}
          title={commentMode ? "Cancel comment mode" : "Add comment (click page to place)"}
          aria-pressed={commentMode}
        >
          <svg className={styles.commentIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
        <button
          type="button"
          className={`${styles.pillboxBtn} ${styles.pillboxBtnMenu} ${sidebarOpen ? styles.pillboxBtnActive : ""}`}
          onClick={() => {
            const next = !sidebarOpen;
            setSidebarOpen(next);
            if (next) setSelectedThreadId(null); // Opening sidebar → default to Tasks list, not a thread.
          }}
          title={sidebarOpen ? "Close sidebar" : "Open comments sidebar"}
          aria-pressed={sidebarOpen}
        >
          <svg className={styles.hamburgerIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        threads={numberedThreads}
        selectedThreadId={selectedThreadId}
        onSelectThread={handleSelectThread}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onHoverResolvedThread={setHoveredResolvedThreadId}
        onRefresh={handleRefresh}
        loading={loading}
        error={error}
        createdBy={createdBy}
        onCreatedByChange={setCreatedBy}
        onPersistName={persistName}
        showNameRequiredPrompt={!!pendingPin && !createdBy.trim()}
        projectId={projectId}
        getThread={getThread}
        onAddComment={handleAddComment}
        onUpdateThreadStatus={handleUpdateThreadStatus}
        onAssignThread={handleAssignThread}
        activityLog={activityLog}
        addLog={addLog}
        onDeleteThread={handleDeleteThread}
        onReorder={handleReorder}
        onEnterCommentMode={() => setCommentMode(true)}
        commentMode={commentMode}
        theme={theme}
        onThemeChange={handleThemeChange}
      />

      {pendingPin && (
        <>
          <div
            className={styles.clickMarker}
            style={{
              left: pendingPin.x,
              top: pendingPin.y,
            }}
            aria-hidden
          />
          {createdBy.trim() && (
            <CommentComposer
              x={pendingPin.x}
              y={pendingPin.y}
              createdBy={createdBy}
              onPost={handleComposerPost}
              onCancel={handleComposerCancel}
            />
          )}
        </>
      )}
    </div>
  );
}

export function Overlay({ projectId }: { projectId: string }) {
  return (
    <ConfigProvider projectId={projectId}>
      <OverlayInner />
    </ConfigProvider>
  );
}
