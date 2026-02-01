/**
 * Renders pins (numbered badges) at page-relative positions.
 * Pins are portaled into their anchor elements for zero-lag scroll when not being dragged.
 * When dragging (repositioning), pins are rendered in the fixed overlay for proper interaction.
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buildSelector, percentToAbsoluteStyle } from "./anchoring";
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

function PinPortalWrapper({
  target,
  children,
}: {
  target: HTMLElement;
  children: React.ReactNode;
}) {
  const prevPosition = useRef<string>("");
  useLayoutEffect(() => {
    prevPosition.current = target.style.position || "";
    if (!target.style.position || target.style.position === "static") {
      target.style.position = "relative";
    }
    return () => {
      target.style.position = prevPosition.current;
    };
  }, [target]);
  return <>{children}</>;
}

function PinButton({
  t,
  isSelected,
  isRepositioning,
  isDragging,
  isPortaled,
  style,
  onSelect,
  onRepositionMouseDown,
}: {
  t: ThreadWithIndex;
  isSelected: boolean;
  isRepositioning: boolean;
  isDragging: boolean;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState({});

  // Re-render on scroll so selector-based positions update
  useEffect(() => {
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          forceUpdate({});
          rafId = null;
        });
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
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

      const el = getElementUnderPoint(e.clientX, e.clientY);
      const target = el && el !== document.documentElement ? el : document.body;
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
                isDragging={isDragging}
                isPortaled={false}
                style={style}
                onSelect={() => onSelect(t.id)}
                onRepositionMouseDown={(e) => handleRepositionMouseDown(e, t)}
              />
            );
          }

          // Convert stored percentages to absolute page coordinates
          const docWidth = Math.max(document.documentElement.scrollWidth, window.innerWidth);
          const docHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);
          const pageX = (t.xPercent / 100) * docWidth;
          const pageY = (t.yPercent / 100) * docHeight;
          
          const pageStyle: React.CSSProperties = {
            position: 'absolute',
            left: `${pageX}px`,
            top: `${pageY}px`,
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
              isDragging={false}
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
