/**
 * Renders pins (numbered badges) on the page.
 *
 * Idle pins are absolutely positioned children of <body>, so they scroll with the page
 * content for free. Their coordinates come from the thread's element anchor (see
 * anchoring.ts) rather than the page size, so a pin lands on the content it was pinned to
 * even when the document is a different height than it was on the author's machine.
 *
 * While being dragged, a pin switches to fixed positioning so it tracks the cursor.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buildSelector, getPinContainerOrigin, resolveAnchorPagePosition } from "./anchoring";
import type { ThreadListItem } from "./store";
import styles from "./PinsLayer.module.css";

type ThreadWithIndex = ThreadListItem & { index: number };

function getElementUnderPoint(clientX: number, clientY: number): Element | null {
  const overlay = document.querySelector("[data-fig-comments-overlay]");
  const prev = overlay instanceof HTMLElement ? overlay.style.pointerEvents : "";
  if (overlay instanceof HTMLElement) overlay.style.pointerEvents = "none";
  const el = document.elementFromPoint(clientX, clientY);
  if (overlay instanceof HTMLElement) overlay.style.pointerEvents = prev;
  return el;
}

function PinButton({
  t,
  isSelected,
  isRepositioning,
  isPortaled,
  style,
  onSelect,
  onRepositionMouseDown,
}: {
  t: ThreadWithIndex;
  isSelected: boolean;
  isRepositioning: boolean;
  isPortaled: boolean;
  style: React.CSSProperties;
  onSelect: () => void;
  onRepositionMouseDown?: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      className={`${isPortaled ? styles.pinAnchored : styles.pin} ${isSelected ? styles.pinSelected : ""} ${isRepositioning ? styles.pinRepositioning : ""}`}
      style={style}
      onClick={(e) => {
        if (isRepositioning) return;
        e.stopPropagation();
        onSelect();
      }}
      onMouseDown={isRepositioning ? onRepositionMouseDown : undefined}
      title={
        isRepositioning
          ? "Drag to reposition, release to save"
          : `Thread ${t.index}${t.status === "RESOLVED" ? " (resolved)" : ""}`
      }
    >
      <span className={styles.pinNumber}>{t.index}</span>
    </button>
  );
}

export function PinsLayer({
  threads,
  selectedThreadId,
  onSelect,
  repositionThreadId,
  repositionThread,
  onUpdatePosition,
  onRepositionEnd,
  allowScrollRestoreRef,
}: {
  threads: ThreadWithIndex[];
  selectedThreadId: string | null;
  onSelect: (id: string) => void;
  repositionThreadId?: string | null;
  repositionThread?: ThreadWithIndex | null;
  onUpdatePosition?: (
    threadId: string,
    params: { selector: string; xPercent: number; yPercent: number; offsetRatioX: number; offsetRatioY: number }
  ) => void | Promise<void>;
  onRepositionEnd?: () => void;
  allowScrollRestoreRef?: React.MutableRefObject<boolean>;
}) {
  const [dragPos, setDragPos] = useState<{ left: number; top: number } | null>(null);
  const dragThreadRef = useRef<ThreadWithIndex | null>(null);
  const [, forceUpdate] = useState({});

  // Pin positions are re-derived from live layout, so recompute whenever layout can shift:
  // resize and reflow (ResizeObserver), late-arriving fonts/images, and scrolling — the
  // last one matters for anchors inside nested scroll containers, which move on the page
  // without changing window.scrollY. Coalesced into one update per frame.
  useEffect(() => {
    let rafId: number | null = null;
    const scheduleUpdate = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        forceUpdate({});
      });
    };

    window.addEventListener("scroll", scheduleUpdate, { passive: true, capture: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("load", scheduleUpdate);

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleUpdate) : null;
    observer?.observe(document.documentElement);
    if (observer && document.body) observer.observe(document.body);

    document.fonts?.ready.then(scheduleUpdate).catch(() => {
      /* font loading unsupported or interrupted */
    });

    return () => {
      window.removeEventListener("scroll", scheduleUpdate, { capture: true });
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("load", scheduleUpdate);
      observer?.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const handleRepositionMouseDown = useCallback(
    (e: React.MouseEvent, t: ThreadWithIndex) => {
      if (!repositionThreadId || t.id !== repositionThreadId || !onUpdatePosition || !onRepositionEnd) return;
      e.preventDefault();
      e.stopPropagation();
      dragThreadRef.current = t;
      setDragPos({ left: e.clientX, top: e.clientY });
    },
    [repositionThreadId, onUpdatePosition, onRepositionEnd]
  );

  useEffect(() => {
    if (dragPos === null || !dragThreadRef.current) return;
    const t = dragThreadRef.current;
    const handleMove = (e: MouseEvent) => {
      setDragPos({ left: e.clientX, top: e.clientY });
    };
    const handleUp = async (e: MouseEvent) => {
      e.preventDefault();
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      setDragPos(null);
      dragThreadRef.current = null;

      // Anchoring to our own UI would make the pin unresolvable on reload, so fall back to body.
      const el = getElementUnderPoint(e.clientX, e.clientY);
      const isOwnUi = el?.closest("[data-fig-comments-overlay]") != null;
      const target = el && !isOwnUi && el !== document.documentElement ? el : document.body;
      const selector = buildSelector(target);
      const rect = target.getBoundingClientRect();
      const w = Math.max(rect.width, 1);
      const h = Math.max(rect.height, 1);
      const offsetRatioX = (e.clientX - rect.left) / w;
      const offsetRatioY = (e.clientY - rect.top) / h;
      // Calculate absolute page coordinates
      const absolutePageX = e.clientX + window.scrollX;
      const absolutePageY = e.clientY + window.scrollY;
      
      // Convert to percentages of document size
      const docWidth = Math.max(document.documentElement.scrollWidth, window.innerWidth);
      const docHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);
      const xPercent = (absolutePageX / docWidth) * 100;
      const yPercent = (absolutePageY / docHeight) * 100;

      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      try {
        await onUpdatePosition?.(t.id, {
          selector,
          xPercent,
          yPercent,
          offsetRatioX,
          offsetRatioY,
        });
      } finally {
        onRepositionEnd?.();
        // Only restore scroll if not currently scrolling to a selected thread
        if (allowScrollRestoreRef?.current !== false) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo(scrollX, scrollY);
            });
          });
        }
      }
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragPos, onUpdatePosition, onRepositionEnd]);

  const threadsToRender =
    repositionThread && !threads.some((x) => x.id === repositionThread.id)
      ? [...threads, repositionThread]
      : threads;

  const containerOrigin = getPinContainerOrigin();

  return (
    <>
      {threadsToRender.map((t) => {
          const isRepositioning = repositionThreadId === t.id;
          const isDragging = isRepositioning && dragPos !== null;
          const isSelected = t.id === selectedThreadId && !isDragging;

          // When dragging, render in fixed overlay
          if (isDragging && dragPos) {
            const style: React.CSSProperties = {
              position: 'fixed',
              left: `${dragPos.left}px`,
              top: `${dragPos.top}px`,
              pointerEvents: 'auto',
            };
            return (
              <PinButton
                key={t.id}
                t={t}
                isSelected={isSelected}
                isRepositioning={isRepositioning}
                isPortaled={false}
                style={style}
                onSelect={() => onSelect(t.id)}
                onRepositionMouseDown={(e) => handleRepositionMouseDown(e, t)}
              />
            );
          }

          // Resolve against the anchored element so the pin lands on the content it was
          // pinned to, whatever the viewport size, then convert into the coordinate space
          // of the containing block (body's padding box).
          const { x: pageX, y: pageY } = resolveAnchorPagePosition(t);
          const pageStyle: React.CSSProperties = {
            position: 'absolute',
            left: `${pageX - containerOrigin.x}px`,
            top: `${pageY - containerOrigin.y}px`,
            pointerEvents: 'auto',
            zIndex: 2147483645,
          };
          
          // Portal directly to body for page-absolute positioning
          return createPortal(
            <PinButton
              key={t.id}
              t={t}
              isSelected={isSelected}
              isRepositioning={isRepositioning}
              isPortaled={true}
              style={pageStyle}
              onSelect={() => onSelect(t.id)}
              onRepositionMouseDown={isRepositioning ? (e) => handleRepositionMouseDown(e, t) : undefined}
            />,
            document.body,
            t.id
          );
        })}
    </>
  );
}
