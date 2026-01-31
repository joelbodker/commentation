/**
 * Modal shown near the click when placing a new pin.
 * Name is only in the sidebar; this composer has Comment + Cancel / Post.
 */
import React, { useState, useRef, useEffect } from "react";
import styles from "./CommentComposer.module.css";

const MODAL_OFFSET = 12;
const MODAL_MAX_WIDTH = 320;

export function CommentComposer({
  x,
  y,
  createdBy,
  onPost,
  onCancel,
  theme = "dark",
}: {
  x: number;
  y: number;
  createdBy: string;
  onPost: (body: string, name: string) => void | Promise<void>;
  onCancel: () => void;
  theme?: "light" | "dark";
}) {
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
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

  const performSubmit = async () => {
    const b = body.trim();
    const name = createdBy.trim() || "Anonymous";
    if (!b || posting) return;
    setPostError(null);
    setPosting(true);
    try {
      const result = onPost(b, name);
      if (result && typeof (result as Promise<unknown>).then === "function") {
        await (result as Promise<void>);
      }
      setBody("");
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter submits, Shift+Enter creates new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      performSubmit();
    }
  };

  return (
    <div
      ref={ref}
      className={`${styles.composer} ${theme === "dark" ? styles.composerDark : ""}`}
      style={{
        position: "fixed",
        width: "min(90vw, 320px)",
        maxWidth: MODAL_MAX_WIDTH,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <form onSubmit={handleSubmit}>
        <div className={styles.composerHeader}>
          <div className={styles.composerAvatar} aria-hidden />
          <span className={styles.composerAuthor}>
            {(createdBy || "Anonymous").toLowerCase().replace(/\s+/g, "_")}
          </span>
        </div>
        <textarea
          className={styles.textarea}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment... (Enter to submit, Shift+Enter for new line)"
          rows={3}
          autoFocus
          disabled={posting}
        />
        {postError && <p className={styles.error}>{postError}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel} disabled={posting}>
            Cancel
          </button>
          <button type="submit" className={styles.submit} disabled={!body.trim() || posting}>
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
