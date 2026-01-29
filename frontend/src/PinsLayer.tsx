/**
 * Renders pins (numbered badges) at page-relative positions.
 * Clicking a pin selects its thread and scrolls to it.
 */
import React, { useEffect, useState } from "react";
import { percentToAbsoluteStyle } from "./anchoring";
import type { ThreadListItem } from "./store";
import styles from "./PinsLayer.module.css";

type ThreadWithIndex = ThreadListItem & { index: number };

export function PinsLayer({
  threads,
  selectedThreadId,
  onSelect,
}: {
  threads: ThreadWithIndex[];
  selectedThreadId: string | null;
  onSelect: (id: string) => void;
}) {
  const [, setScrollPosition] = useState({ x: 0, y: 0 });

  // Recalculate pin positions on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition({ x: window.scrollX, y: window.scrollY });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {threads.map((t) => {
        const style = percentToAbsoluteStyle(t.xPercent, t.yPercent, t.selector);
        const isSelected = t.id === selectedThreadId;
        return (
          <button
            key={t.id}
            type="button"
            className={`${styles.pin} ${isSelected ? styles.pinSelected : ""}`}
            style={style}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(t.id);
            }}
            title={`Thread ${t.index}${t.status === "RESOLVED" ? " (resolved)" : ""}`}
          >
            <span className={styles.pinNumber}>{t.index}</span>
          </button>
        );
      })}
    </>
  );
}
