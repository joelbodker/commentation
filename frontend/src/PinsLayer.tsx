/**
 * Renders pins (numbered badges) at viewport-relative positions.
 * Clicking a pin selects its thread and scrolls to it.
 */
import React from "react";
import { percentToFixedStyle } from "./anchoring";
import type { ThreadListItem } from "./api";
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
  return (
    <>
      {threads.map((t) => {
        const style = percentToFixedStyle(t.xPercent, t.yPercent);
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
