/**
 * Top-level overlay: floating button, pins layer, sidebar, comment mode, and modal composer.
 * State: commentMode, sidebarOpen, selectedThreadId, pendingPin (click position for new thread).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfigProvider, useConfig } from "./config";
import * as source from "./source";
import type { ThreadListItem } from "./store";
import { buildSelector, percentToAbsoluteStyle, scrollToPinY } from "./anchoring";
import { PinsLayer } from "./PinsLayer";
import { Sidebar } from "./Sidebar";
import { CommentComposer } from "./CommentComposer";
import styles from "./Overlay.module.css";

const NAME_STORAGE_KEY_PREFIX = "fig-comments-name-";
const THEME_STORAGE_KEY = "commentation-theme";
const ORDER_STORAGE_KEY_PREFIX = "commentation-order-";
const HINT_DISMISSED_KEY_PREFIX = "commentation-hint-dismissed-";

/**
 * Click marker - blue circle that appears where you click.
 * Centered on the click point by offsetting by half the marker size.
 */
function ClickMarker({ x, y }: { x: number; y: number }) {
  // Center the 16x16 marker on the click point
  const left = x - 8;
  const top = y - 8;
  
  return (
    <div
      style={{
        position: "fixed",
        left: `${left}px`,
        top: `${top}px`,
        width: 16,
        height: 16,
        borderRadius: "50%",
        border: "2px solid #0d99ff",
        background: "rgba(255, 255, 255, 0.9)",
        pointerEvents: "none",
        zIndex: 2147483646,
        boxShadow: "0 0 0 2px #fff",
      }}
      aria-hidden
    />
  );
}

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
  const { projectId, hintText } = useConfig();
  const [hintDismissed, setHintDismissed] = useState(() => {
    if (typeof window === "undefined" || !hintText) return false;
    try {
      const key = HINT_DISMISSED_KEY_PREFIX + projectId;
      return sessionStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (hintDismissed && hintText) {
      try {
        sessionStorage.setItem(HINT_DISMISSED_KEY_PREFIX + projectId, "1");
      } catch {
        /* ignore */
      }
    }
  }, [hintDismissed, hintText, projectId]);

  // Ensure body is positioned for absolute children
  useEffect(() => {
    const body = document.body;
    const computedPosition = window.getComputedStyle(body).position;
    if (computedPosition === 'static') {
      body.style.position = 'relative';
      return () => {
        body.style.position = '';
      };
    }
  }, []);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return stored === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<"open" | "resolved">("open");
  const [commentMode, setCommentMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [pendingPin, setPendingPin] = useState<{
    selector: string;
    offsetRatioX: number;
    offsetRatioY: number;
    pageX: number;
    pageY: number;
    scrollX: number;
    scrollY: number;
  } | null>(null);
  const [hoveredResolvedThreadId, setHoveredResolvedThreadId] = useState<string | null>(null);
  const [repositionThreadId, setRepositionThreadId] = useState<string | null>(null);
  const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
  const allowScrollRestoreRef = useRef(true);
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
  const [inboxUnreadCount, setInboxUnreadCount] = useState(0);
  const [activityLog, setActivityLog] = useState<import("./activityLog").ActivityLogEntry[]>([]);
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

  const addLog = useCallback(
    (
      message: string,
      options?: { threadId?: string; type?: import("./activityLog").LogEventType; meta?: Record<string, string | number | undefined> }
    ) => {
      const id = `log-${++logIdRef.current}`;
      const timestamp = new Date().toISOString();
      const entry: import("./activityLog").ActivityLogEntry = {
        id,
        message,
        timestamp,
        threadId: options?.threadId ?? null,
        type: options?.type ?? "generic",
        meta: options?.meta as import("./activityLog").ActivityLogEntry["meta"],
      };
      setActivityLog((prev) => [...prev.slice(-499), entry]);
      source.addActivityLogEntry(projectId, {
        threadId: options?.threadId,
        type: options?.type,
        message,
        meta: options?.meta as Record<string, unknown>,
      }).catch(() => { /* ignore persistence errors */ });
    },
    [projectId]
  );

  const persistName = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      try {
        localStorage.setItem(NAME_STORAGE_KEY_PREFIX + projectId, trimmed);
      } catch {
        /* ignore */
      }
      setCreatedBy(trimmed);
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

  const fetchThreads = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await source.getThreads(projectId, null, "all");
      setThreads(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load threads");
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    source.getActivityLog(projectId).then((entries) => {
      if (entries.length > 0) {
        setActivityLog(entries);
      }
    }).catch(() => { /* no API, keep empty */ });
  }, [projectId]);

  const handlePageClick = useCallback(
    (e: MouseEvent) => {
      if (!commentMode || pendingPin) return;
      const target = e.target as Node;
      const root = document.getElementById("fig-comments-root");
      if (root?.contains(target)) return;
      const overlay = document.querySelector("[data-fig-comments-overlay]");
      if (overlay?.contains(target)) return;
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
      const rect = el.getBoundingClientRect();
      const w = Math.max(rect.width, 1);
      const h = Math.max(rect.height, 1);
      const offsetRatioX = (e.clientX - rect.left) / w;
      const offsetRatioY = (e.clientY - rect.top) / h;
      
      // Store EXACT viewport position at click time
      const clickViewportX = e.clientX;
      const clickViewportY = e.clientY;
      
      setPendingPin({
        selector,
        offsetRatioX,
        offsetRatioY,
        pageX: clickViewportX,
        pageY: clickViewportY,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
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

  // Re-render on scroll so ClickMarker and CommentComposer stay aligned with page content
  useEffect(() => {
    const handleScroll = () => setScrollPos({ x: window.scrollX, y: window.scrollY });
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // When pendingPin exists, also listen to scroll on the clicked element's scroll ancestors
  // (handles divs with overflow:scroll that window.scrollY doesn't capture)
  useEffect(() => {
    if (!pendingPin) return;
    const el = document.querySelector(pendingPin.selector);
    if (!el) return;
    const scrollParents: (Window | Element)[] = [window];
    let parent: Element | null = el.parentElement;
    while (parent && parent !== document.body) {
      const style = getComputedStyle(parent);
      const overflowY = style.overflowY || style.overflow;
      if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
        scrollParents.push(parent);
      }
      parent = parent.parentElement;
    }
    const handleScroll = () => setScrollPos((p) => ({ ...p }));
    scrollParents.forEach((target) => {
      target.addEventListener("scroll", handleScroll, { passive: true });
    });
    return () => {
      scrollParents.forEach((target) => {
        target.removeEventListener("scroll", handleScroll);
      });
    };
  }, [pendingPin?.selector]);

  // Show crosshair cursor when in comment mode so it's obvious you're placing a pin.
  // When name-required popup shows (pendingPin without name), revert to default cursor.
  const showCrosshair = commentMode && !(pendingPin && !createdBy.trim());
  useEffect(() => {
    if (!showCrosshair) {
      document.body.style.cursor = "";
      return;
    }
    const prev = document.body.style.cursor;
    document.body.style.cursor = "crosshair";
    return () => {
      document.body.style.cursor = prev;
    };
  }, [showCrosshair]);

  const handleComposerCancel = useCallback(() => {
    setPendingPin(null);
    setCommentMode(false);
  }, []);

  const handleComposerPost = useCallback(
    async (body: string, name: string) => {
      if (!pendingPin) return;
      
      // Calculate absolute page coordinates (pixels from top-left of document)
      // pendingPin.pageX/pageY are viewport coords (clientX/Y)
      // pendingPin.scrollX/scrollY are scroll position at click time
      const absolutePageX = pendingPin.pageX + pendingPin.scrollX;
      const absolutePageY = pendingPin.pageY + pendingPin.scrollY;
      
      // Convert to percentages of document size for storage
      const docWidth = Math.max(document.documentElement.scrollWidth, window.innerWidth);
      const docHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);
      const xPercent = (absolutePageX / docWidth) * 100;
      const yPercent = (absolutePageY / docHeight) * 100;
      
      try {
        const thread = await source.createThread(projectId, pageUrl, {
          selector: pendingPin.selector,
          xPercent,
          yPercent,
          offsetRatioX: pendingPin.offsetRatioX,
          offsetRatioY: pendingPin.offsetRatioY,
          body,
          createdBy: name,
        });
        await fetchThreads();
        setPendingPin(null);
        setCommentMode(false);
        addLog(`Task created by ${name}: "${body}"`, {
          threadId: thread.id,
          type: "created",
          meta: { createdBy: name, bodyPreview: body, pageUrl },
        });
        // Defer sidebar open to next frame so it animates (composer unmounts first, sidebar paints closed state)
        requestAnimationFrame(() => {
          setSelectedThreadId(null);
          setSidebarOpen(true);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create task");
      }
    },
    [projectId, pageUrl, pendingPin, addLog, fetchThreads]
  );

  const handleSelectThread = useCallback(
    (id: string) => {
      setSelectedThreadId(id);
      setSidebarOpen(true);
      const t = threads.find((x) => x.id === id);
      if (t && t.pageUrl === pageUrl) {
        // Prevent scroll restoration from repositioning from interfering
        allowScrollRestoreRef.current = false;
        scrollToPinY(t.yPercent, t.selector);
        // Re-enable after scroll completes (smooth scroll takes ~300-500ms)
        setTimeout(() => {
          allowScrollRestoreRef.current = true;
        }, 1000);
      }
    },
    [threads, pageUrl]
  );

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchThreads();
  }, [fetchThreads]);

  const handleDeleteThread = useCallback(
    async (threadId: string) => {
      const t = threads.find((x) => x.id === threadId);
      const openList = threads.filter((x) => x.status === "OPEN");
      const idx = t && openList.length ? openList.findIndex((x) => x.id === threadId) + 1 : null;
      const name = createdBy.trim() || "Anonymous";
      const snippet = t?.comments?.[0]?.body?.slice(0, 60) ?? "";
      addLog(`Task deleted by ${name}`, {
        threadId: threadId,
        type: "deleted",
        meta: { createdBy: name, threadIndex: idx ?? undefined, pageUrl: t?.pageUrl, bodyPreview: snippet },
      });
      const threadPageUrl = t?.pageUrl ?? pageUrl;
      try {
        await source.deleteThread(projectId, threadPageUrl, threadId);
        await fetchThreads();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete task");
      }
    },
    [projectId, pageUrl, threads, createdBy, addLog, fetchThreads]
  );

  const [detailThread, setDetailThread] = useState<ThreadListItem | null>(null);
  useEffect(() => {
    if (!selectedThreadId) {
      setDetailThread(null);
      return;
    }
    const fromList = threads.find((t) => t.id === selectedThreadId);
    if (fromList) {
      setDetailThread(fromList);
      return;
    }
    source.getThread(projectId, null, selectedThreadId).then((t) => setDetailThread(t));
  }, [selectedThreadId, threads, projectId]);

  const handleAddComment = useCallback(
    async (threadId: string, threadPageUrl: string, body: string, createdByName: string) => {
      try {
        await source.addComment(projectId, threadPageUrl, threadId, body, createdByName);
        await fetchThreads();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add reply");
      }
    },
    [projectId, fetchThreads]
  );

  const handleUpdateThreadStatus = useCallback(
    async (threadId: string, threadPageUrl: string, status: "OPEN" | "RESOLVED", resolvedBy?: string) => {
      try {
        await source.updateThreadStatus(projectId, threadPageUrl, threadId, status, resolvedBy);
        await fetchThreads();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update status");
      }
    },
    [projectId, fetchThreads]
  );

  const handleAssignThread = useCallback(
    async (threadId: string, threadPageUrl: string, assignedTo: string, assignedBy: string) => {
      try {
        await source.assignThread(projectId, threadPageUrl, threadId, assignedTo, assignedBy);
        await fetchThreads();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to assign");
      }
    },
    [projectId, fetchThreads]
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

  const handleStartReposition = useCallback((threadId: string) => {
    setRepositionThreadId(threadId);
  }, []);

  const handleUpdatePosition = useCallback(
    async (
      threadId: string,
      params: { selector: string; xPercent: number; yPercent: number; offsetRatioX: number; offsetRatioY: number }
    ) => {
      const t = threads.find((x) => x.id === threadId);
      const threadPageUrl = t?.pageUrl ?? pageUrl;
      
      // Optimistically update local state first
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === threadId
            ? { ...thread, ...params }
            : thread
        )
      );
      
      try {
        await source.updateThreadPosition(projectId, threadPageUrl, threadId, params);
        // Refetch to ensure we're in sync with backend
        await fetchThreads();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reposition");
        // Revert optimistic update on error
        await fetchThreads();
      }
    },
    [projectId, pageUrl, threads, fetchThreads]
  );

  const handleRepositionEnd = useCallback(() => {
    setRepositionThreadId(null);
    // Re-enable scroll restoration after a brief delay
    setTimeout(() => {
      allowScrollRestoreRef.current = true;
    }, 100);
  }, []);

  const knownNames = useMemo(() => {
    const names = new Set<string>();
    for (const t of threads) {
      if (t.createdBy?.trim()) names.add(t.createdBy.trim());
      if (t.assignedTo?.trim()) names.add(t.assignedTo.trim());
      if (t.assignedBy?.trim()) names.add(t.assignedBy.trim());
      if (t.resolvedBy?.trim()) names.add(t.resolvedBy.trim());
      for (const c of t.comments ?? []) {
        if (c.createdBy?.trim()) names.add(c.createdBy.trim());
      }
    }
    if (createdBy.trim()) names.add(createdBy.trim());
    return Array.from(names).sort();
  }, [threads, createdBy]);

  const numberedThreads = useMemo(() => {
    const status = statusFilter === "open" ? "OPEN" : "RESOLVED";
    const filtered = threads.filter((t) => t.status === status);
    const currentPageOnly = filtered.filter((t) => t.pageUrl === pageUrl);
    const withOrder =
      currentPageOnly.length === filtered.length
        ? applyOrder(filtered, taskOrder)
        : [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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
  }, [threads, statusFilter, taskOrder, createdBy, pageUrl]);
  const openThreadsForPins = useMemo(() => {
    const currentPageThreads = threads.filter((t) => t.pageUrl === pageUrl && t.status === "OPEN");
    const withOrder = applyOrder(currentPageThreads, taskOrder);
    const assignedFirst =
      createdBy.trim()
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
  }, [threads, taskOrder, createdBy, pageUrl]);

  const repositionThread = useMemo(() => {
    if (!repositionThreadId) return null;
    const t = threads.find((x) => x.id === repositionThreadId);
    if (!t || t.pageUrl !== pageUrl) return null;
    const inOpen = openThreadsForPins.find((x) => x.id === repositionThreadId);
    return inOpen ?? { ...t, index: openThreadsForPins.length + 1 };
  }, [repositionThreadId, threads, pageUrl, openThreadsForPins]);
  const hoveredResolvedThread = hoveredResolvedThreadId
    ? threads.find((t) => t.id === hoveredResolvedThreadId)
    : null;

  // rAF loop: pins/markers must track content during overscroll (bounce) when scroll events don't fire
  const needsLayoutTick =
    openThreadsForPins.length > 0 || !!pendingPin || !!(hoveredResolvedThreadId && statusFilter === "resolved");
  useEffect(() => {
    if (!needsLayoutTick) return;
    let rafId: number;
    const tick = () => {
      setScrollPos((p) => ({ ...p }));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [needsLayoutTick]);

  // Disable overscroll when pins are visible: per CSS spec, fixed elements stay put during overscroll
  // and getBoundingClientRect() doesn't report it—so pins can't track. Disabling overscroll fixes alignment.
  const needsOverscrollDisabled =
    openThreadsForPins.length > 0 || !!pendingPin || !!(hoveredResolvedThreadId && statusFilter === "resolved");
  useEffect(() => {
    if (!needsOverscrollDisabled) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overscrollBehaviorY;
    const prevBody = body.style.overscrollBehaviorY;
    html.style.overscrollBehaviorY = "none";
    body.style.overscrollBehaviorY = "none";
    return () => {
      html.style.overscrollBehaviorY = prevHtml;
      body.style.overscrollBehaviorY = prevBody;
    };
  }, [needsOverscrollDisabled]);

  const handleThemeChange = useCallback((next: Theme) => {
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  // Listen for external theme changes (e.g., from landing page toggle)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const newTheme = e.newValue === "light" ? "light" : "dark";
        setTheme(newTheme);
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    return () => document.body.removeAttribute("data-theme");
  }, [theme]);

  const prevSidebarOpenRef = useRef(sidebarOpen);
  useEffect(() => {
    if (prevSidebarOpenRef.current && !sidebarOpen) {
      (document.activeElement as HTMLElement | null)?.blur();
    }
    prevSidebarOpenRef.current = sidebarOpen;
  }, [sidebarOpen]);

  // Tooltip that follows mouse when in comment mode (until user places a pin)
  useEffect(() => {
    if (!commentMode) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [commentMode]);

  // Compute viewport position for pending pin (anchored to element, works with any scroll container)
  const pendingPinViewport = useMemo(() => {
    if (!pendingPin) return null;
    try {
      const el = document.querySelector(pendingPin.selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        const w = Math.max(rect.width, 1);
        const h = Math.max(rect.height, 1);
        return {
          x: rect.left + pendingPin.offsetRatioX * w,
          y: rect.top + pendingPin.offsetRatioY * h,
        };
      }
    } catch {
      /* selector invalid */
    }
    return {
      x: pendingPin.pageX - scrollPos.x,
      y: pendingPin.pageY - scrollPos.y,
    };
  }, [pendingPin, scrollPos]);

  return (
    <div className={styles.wrapper} data-theme={theme} data-fig-comments-overlay>
      <div className={styles.pinsLayer} aria-hidden>
        <PinsLayer
          threads={openThreadsForPins}
          selectedThreadId={selectedThreadId}
          onSelect={handleSelectThread}
          repositionThreadId={repositionThreadId}
          repositionThread={repositionThread}
          onUpdatePosition={handleUpdatePosition}
          onRepositionEnd={handleRepositionEnd}
          allowScrollRestoreRef={allowScrollRestoreRef}
        />
      </div>
      {/* Click marker - anchored to clicked element so it sticks regardless of scroll container */}
      {pendingPinViewport && <ClickMarker x={pendingPinViewport.x} y={pendingPinViewport.y} />}
      {/* When hovering a resolved task in the sidebar, show a dot at its original pin location. */}
      {hoveredResolvedThread && statusFilter === "resolved" && (
        <div
          className={styles.resolvedHoverDot}
          style={percentToAbsoluteStyle(
            hoveredResolvedThread.xPercent,
            hoveredResolvedThread.yPercent,
            hoveredResolvedThread.selector,
            hoveredResolvedThread.offsetRatioX,
            hoveredResolvedThread.offsetRatioY
          )}
          aria-hidden
        />
      )}

      {/* Tooltip when in comment mode: "Now, click anywhere on the page to create a new comment." Follows mouse. */}
      {commentMode && !pendingPin && (
        <div
          className={styles.commentModeTooltip}
          style={{
            left: mousePos.x + 16,
            top: mousePos.y + 16,
          }}
          aria-hidden
        >
          Now, click anywhere on the page to create a new comment.
        </div>
      )}

      {/* Handwritten hint: "try it out here" with arrow pointing to pillbox. Dismisses on pillbox click. */}
      {hintText && (
        <div
          className={styles.pillboxHint}
          style={{
            opacity: hintDismissed ? 0 : 1,
            pointerEvents: hintDismissed ? "none" : "auto",
          }}
          aria-hidden
        >
          <span className={styles.pillboxHintText}>{hintText}</span>
          <span className={styles.pillboxHintArrow} aria-hidden>→</span>
        </div>
      )}

      <div className={styles.pillboxFab} aria-label="Commentation">
        <button
          type="button"
          className={`${styles.pillboxBtn} ${styles.pillboxBtnComment} ${commentMode ? styles.pillboxBtnActive : ""}`}
          onClick={(e) => {
            setHintDismissed(true);
            setMousePos({ x: e.clientX, y: e.clientY });
            setCommentMode((c) => !c);
          }}
          title={commentMode ? "Cancel comment mode" : "Add comment (click page to place)"}
          aria-pressed={commentMode}
        >
          <svg className={styles.commentIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
        <button
          type="button"
          className={`${styles.pillboxBtn} ${styles.pillboxBtnMenu}`}
          onClick={() => {
            setHintDismissed(true);
            const next = !sidebarOpen;
            setSidebarOpen(next);
            if (next) setSelectedThreadId(null); // Opening sidebar → default to Tasks list, not a thread.
          }}
          title={sidebarOpen ? "Close sidebar" : "Open comments sidebar"}
          aria-pressed={sidebarOpen}
        >
          <div className={styles.pillboxMenuIconWrap}>
            <svg
              className={styles.hamburgerIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              style={{ opacity: sidebarOpen ? 0 : 1 }}
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <svg
              className={styles.closeIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                margin: "auto",
                opacity: sidebarOpen ? 1 : 0,
              }}
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          {!sidebarOpen && inboxUnreadCount > 0 && (
            <span className={styles.pillboxDot} aria-hidden />
          )}
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
        showNameRequiredPrompt={(() => {
          if (!pendingPin) return false;
          try {
            const savedName = localStorage.getItem(NAME_STORAGE_KEY_PREFIX + projectId) ?? "";
            return !(savedName && savedName === createdBy.trim());
          } catch {
            return true;
          }
        })()}
        knownNames={knownNames}
        projectId={projectId}
        selectedThread={detailThread}
        showReorder={numberedThreads.length > 0 && numberedThreads.every((t) => t.pageUrl === pageUrl)}
        onAddComment={handleAddComment}
        onUpdateThreadStatus={handleUpdateThreadStatus}
        onAssignThread={handleAssignThread}
        onStartReposition={
          detailThread && detailThread.pageUrl === pageUrl
            ? handleStartReposition
            : undefined
        }
        repositioningThreadId={repositionThreadId}
        activityLog={activityLog}
        addLog={addLog}
        onDeleteThread={handleDeleteThread}
        onReorder={handleReorder}
        onEnterCommentMode={() => setCommentMode(true)}
        commentMode={commentMode}
        theme={theme}
        onThemeChange={handleThemeChange}
        onInboxUnreadChange={setInboxUnreadCount}
        onBackToTasks={() => setSelectedThreadId(null)}
      />

      {pendingPin && (
        <>
          {(() => {
            // Only show composer if name is persisted (saved to localStorage)
            const trimmedName = createdBy.trim();
            if (!trimmedName) return null;
            try {
              const savedName = localStorage.getItem(NAME_STORAGE_KEY_PREFIX + projectId);
              if (savedName === trimmedName && pendingPinViewport) {
                return (
                  <CommentComposer
                    x={pendingPinViewport.x}
                    y={pendingPinViewport.y}
                    createdBy={createdBy}
                    onPost={handleComposerPost}
                    onCancel={handleComposerCancel}
                    theme={theme}
                  />
                );
              }
            } catch {
              /* ignore */
            }
            return null;
          })()}
        </>
      )}
    </div>
  );
}

export function Overlay({ projectId, hintText }: { projectId: string; hintText?: string }) {
  return (
    <ConfigProvider projectId={projectId} hintText={hintText}>
      <OverlayInner />
    </ConfigProvider>
  );
}
