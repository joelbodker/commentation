/**
 * Top-level overlay: floating button, pins layer, sidebar, comment mode, and modal composer.
 * State: commentMode, sidebarOpen, selectedThreadId, pendingPin (click position for new thread).
 */
import React, { useCallback, useEffect, useState } from "react";
import { ConfigProvider, useConfig } from "./config";
import { listThreads, type ThreadListItem } from "./api";
import { percentToFixedStyle, scrollToPinY, buildSelector, eventToPercent } from "./anchoring";
import { PinsLayer } from "./PinsLayer";
import { Sidebar } from "./Sidebar";
import { CommentComposer } from "./CommentComposer";
import styles from "./Overlay.module.css";

function OverlayInner() {
  const { projectId, backendUrl } = useConfig();
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [includeResolved, setIncludeResolved] = useState(false);
  const [commentMode, setCommentMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number; selector: string } | null>(null);
  const [createdBy, setCreatedBy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const fetchThreads = useCallback(async () => {
    try {
      setError(null);
      const list = await listThreads(backendUrl, projectId, pageUrl, includeResolved);
      setThreads(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load threads");
    } finally {
      setLoading(false);
    }
  }, [backendUrl, projectId, pageUrl, includeResolved]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handlePageClick = useCallback(
    (e: MouseEvent) => {
      if (!commentMode || pendingPin) return;
      const target = e.target as Node;
      const root = document.getElementById("fig-comments-root");
      if (root?.contains(target)) return;
      const el = (e.target as Element);
      const selector = buildSelector(el);
      const { xPercent, yPercent } = eventToPercent(e);
      setPendingPin({
        x: (xPercent / 100) * window.innerWidth,
        y: (yPercent / 100) * window.innerHeight,
        selector,
      });
    },
    [commentMode, pendingPin]
  );

  useEffect(() => {
    if (!commentMode) return;
    window.addEventListener("click", handlePageClick);
    return () => window.removeEventListener("click", handlePageClick);
  }, [commentMode, handlePageClick]);

  const handleComposerCancel = useCallback(() => {
    setPendingPin(null);
  }, []);

  const handleComposerPost = useCallback(
    async (body: string, name: string) => {
      if (!pendingPin) return;
      try {
        const { createThread } = await import("./api");
        const xPercent = (pendingPin.x / window.innerWidth) * 100;
        const yPercent = (pendingPin.y / window.innerHeight) * 100;
        const thread = await createThread(backendUrl, projectId, {
          pageUrl,
          selector: pendingPin.selector,
          xPercent,
          yPercent,
          body,
          createdBy: name,
        });
        setThreads((prev) => [
          ...prev,
          {
            ...thread,
            latestComment: thread.comments?.[0] ?? null,
            commentCount: thread.comments?.length ?? 1,
          },
        ]);
        setPendingPin(null);
        setSelectedThreadId(thread.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create thread");
      }
    },
    [backendUrl, projectId, pageUrl, pendingPin]
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

  const numberedThreads = threads.map((t, i) => ({ ...t, index: i + 1 }));

  return (
    <div className={styles.wrapper}>
      <div className={styles.pinsLayer} aria-hidden>
        <PinsLayer
          threads={numberedThreads}
          selectedThreadId={selectedThreadId}
          onSelect={handleSelectThread}
        />
      </div>

      <button
        type="button"
        className={styles.fab}
        onClick={() => {
          if (!sidebarOpen) {
            setSidebarOpen(true);
          } else {
            setCommentMode((c) => !c);
          }
        }}
        title={sidebarOpen ? (commentMode ? "Turn off comment mode" : "Comment mode") : "Open comments"}
        aria-pressed={commentMode}
      >
        {commentMode ? "✓" : "💬"}
      </button>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        threads={numberedThreads}
        selectedThreadId={selectedThreadId}
        onSelectThread={handleSelectThread}
        includeResolved={includeResolved}
        onIncludeResolvedChange={setIncludeResolved}
        onRefresh={handleRefresh}
        loading={loading}
        error={error}
        createdBy={createdBy}
        onCreatedByChange={setCreatedBy}
        backendUrl={backendUrl}
        projectId={projectId}
      />

      {pendingPin && (
        <CommentComposer
          x={pendingPin.x}
          y={pendingPin.y}
          createdBy={createdBy}
          onCreatedByChange={setCreatedBy}
          onPost={handleComposerPost}
          onCancel={handleComposerCancel}
        />
      )}
    </div>
  );
}

export function Overlay({
  projectId,
  backendUrl,
}: {
  projectId: string;
  backendUrl: string;
}) {
  return (
    <ConfigProvider projectId={projectId} backendUrl={backendUrl}>
      <OverlayInner />
    </ConfigProvider>
  );
}
