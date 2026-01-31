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
  const [, setLayoutTick] = useState(0);

  // rAF loop: re-read getBoundingClientRect every frame so pins track content on scroll
  useEffect(() => {
    if (threads.length === 0) return;
    let rafId: number;
    const tick = () => {
      setLayoutTick((t) => t + 1);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [threads.length]);

  return (
    <>
      {threads.map((t) => {
        const style = percentToAbsoluteStyle(
          t.xPercent,
          t.yPercent,
          t.selector,
          t.offsetRatioX,
          t.offsetRatioY
        );
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
