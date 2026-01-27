/**
 * Modal shown near the click when placing a new pin.
 * Textarea for body, createdBy field, Cancel / Post.
 */
import React, { useState, useRef, useEffect } from "react";
import styles from "./CommentComposer.module.css";

const MODAL_OFFSET = 12;
const MODAL_MAX_WIDTH = 320;

export function CommentComposer({
  x,
  y,
  createdBy,
  onCreatedByChange,
  onPost,
  onCancel,
}: {
  x: number;
  y: number;
  createdBy: string;
  onCreatedByChange: (v: string) => void;
  onPost: (body: string, name: string) => void;
  onCancel: () => void;
}) {
  const [body, setBody] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let left = x + MODAL_OFFSET;
    let top = y + MODAL_OFFSET;
    const rect = el.getBoundingClientRect();
    if (left + rect.width > window.innerWidth) left = x - rect.width - MODAL_OFFSET;
    if (top + rect.height > window.innerHeight) top = y - rect.height - MODAL_OFFSET;
    if (left < 0) left = MODAL_OFFSET;
    if (top < 0) top = MODAL_OFFSET;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [x, y]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const b = body.trim();
    const name = createdBy.trim() || "Anonymous";
    if (!b) return;
    onPost(b, name);
    setBody("");
  };

  return (
    <div
      ref={ref}
      className={styles.composer}
      style={{
        position: "fixed",
        width: "min(90vw, 320px)",
        maxWidth: MODAL_MAX_WIDTH,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <form onSubmit={handleSubmit}>
        <label className={styles.label}>Comment</label>
        <textarea
          className={styles.textarea}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          autoFocus
        />
        <label className={styles.label}>Your name</label>
        <input
          type="text"
          className={styles.input}
          value={createdBy}
          onChange={(e) => onCreatedByChange(e.target.value)}
          placeholder="Name or email"
        />
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className={styles.submit} disabled={!body.trim()}>
            Post
          </button>
        </div>
      </form>
    </div>
  );
}
