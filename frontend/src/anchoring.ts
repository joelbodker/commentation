/**
 * DOM anchoring utilities for pin placement and lookup.
 *
 * A pin stores two independent descriptions of where it lives:
 *
 *  1. `selector` + `offsetRatioX/Y` — position relative to an element. Re-derived from
 *     live layout on every render, so it survives different window sizes, fonts, zoom
 *     levels and machines. This is the primary anchor.
 *  2. `xPercent` / `yPercent` — position as a percentage of the document's scroll size.
 *     Only a fallback for when the selector no longer resolves, because document height
 *     changes whenever text reflows (different viewport width, fonts, images, dynamic
 *     content), which moves the pin relative to the content it was pinned to.
 *
 * Every code path that draws or scrolls to a pin must go through the resolvers here, so
 * the composer preview, the pin, the resolved-hover dot and "scroll to task" all agree.
 */

const OVERLAY_ATTR = "data-fig-comments-overlay";

/** Attributes that identify an element more durably than an nth-of-type chain. */
const STABLE_ATTRS = ["data-commentation-anchor", "data-testid", "data-test-id", "data-id"];

export type Anchor = {
  selector?: string;
  xPercent: number;
  yPercent: number;
  offsetRatioX?: number;
  offsetRatioY?: number;
};

export type Point = { x: number; y: number };

function escapeSelectorValue(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/["\\]/g, "\\$&");
}

function resolvesTo(selector: string, el: Element): boolean {
  try {
    return document.querySelector(selector) === el;
  } catch {
    return false;
  }
}

/** A selector for this element alone, using an id or a stable data attribute. */
function uniqueOwnSelector(el: Element): string | null {
  const tag = el.tagName.toLowerCase();
  if (el.id) {
    const byId = `#${escapeSelectorValue(el.id)}`;
    if (resolvesTo(byId, el)) return byId;
  }
  for (const attr of STABLE_ATTRS) {
    const value = el.getAttribute(attr);
    if (!value) continue;
    const bySelector = `${tag}[${attr}="${escapeSelectorValue(value)}"]`;
    if (resolvesTo(bySelector, el)) return bySelector;
  }
  return null;
}

/** `tag` plus an nth-of-type index when the element has same-tag siblings. */
function positionalSelector(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const parent = el.parentElement;
  if (!parent) return tag;
  const sameTag = Array.from(parent.children).filter((n) => n.tagName === el.tagName);
  if (sameTag.length <= 1) return tag;
  return `${tag}:nth-of-type(${sameTag.indexOf(el) + 1})`;
}

/**
 * Build a CSS selector for the given element.
 *
 * Prefers an id or stable data attribute (on the element or an ancestor) and falls back to
 * an nth-of-type chain. The result is verified to resolve back to `el`; when it doesn't,
 * a full positional chain is used instead, since a selector that resolves to the wrong
 * element would silently move the pin.
 */
export function buildSelector(el: Element): string {
  const own = uniqueOwnSelector(el);
  if (own) return own;

  const path: string[] = [];
  let current: Element | null = el;
  while (current && current !== document.body && current !== document.documentElement) {
    const anchorSelector = uniqueOwnSelector(current);
    if (anchorSelector) {
      path.unshift(anchorSelector);
      break;
    }
    path.unshift(positionalSelector(current));
    current = current.parentElement;
  }

  const selector = path.join(" > ");
  if (selector && resolvesTo(selector, el)) return selector;

  // The shortcut chain is ambiguous, so fall back to a fully positional one from the root.
  const fullPath: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    fullPath.unshift(positionalSelector(node));
    node = node.parentElement;
  }
  const fullSelector = fullPath.join(" > ");
  return fullSelector && resolvesTo(fullSelector, el) ? fullSelector : selector;
}

function documentSize(): { width: number; height: number } {
  return {
    width: Math.max(document.documentElement.scrollWidth, window.innerWidth),
    height: Math.max(document.documentElement.scrollHeight, window.innerHeight),
  };
}

/**
 * The element an anchor points at, or null when it can no longer be trusted:
 * an invalid/stale selector, our own overlay UI, or an element that isn't laid out
 * (`display: none`), which would otherwise report an empty rect at the page origin.
 */
export function resolveAnchorElement(selector?: string): Element | null {
  if (!selector) return null;
  let el: Element | null;
  try {
    el = document.querySelector(selector);
  } catch {
    return null;
  }
  if (!el || !el.isConnected) return null;
  if (el.closest(`[${OVERLAY_ATTR}]`)) return null;
  if (el.getClientRects().length === 0) return null;
  return el;
}

/**
 * Position of an anchor in page coordinates (pixels from the top-left of the document).
 *
 * `anchored` reports whether the element anchor was used, so callers can tell an exact
 * position from a best-effort one.
 */
export function resolveAnchorPagePosition(anchor: Anchor): Point & { anchored: boolean } {
  const el = resolveAnchorElement(anchor.selector);
  if (el) {
    const rect = el.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    const ratioX = typeof anchor.offsetRatioX === "number" ? anchor.offsetRatioX : 0.5;
    const ratioY = typeof anchor.offsetRatioY === "number" ? anchor.offsetRatioY : 0.5;
    return {
      x: rect.left + window.scrollX + ratioX * width,
      y: rect.top + window.scrollY + ratioY * height,
      anchored: true,
    };
  }

  const { width, height } = documentSize();
  return {
    x: (anchor.xPercent / 100) * width,
    y: (anchor.yPercent / 100) * height,
    anchored: false,
  };
}

/** Position of an anchor in viewport coordinates, for `position: fixed` elements. */
export function resolveAnchorViewportPosition(anchor: Anchor): Point {
  const { x, y } = resolveAnchorPagePosition(anchor);
  return { x: x - window.scrollX, y: y - window.scrollY };
}

/** `left`/`top` for a `position: fixed` element placed at an anchor. */
export function anchorToFixedStyle(anchor: Anchor): { left: string; top: string } {
  const { x, y } = resolveAnchorViewportPosition(anchor);
  return { left: `${x}px`, top: `${y}px` };
}

/**
 * Origin of the containing block that pins are positioned within.
 *
 * Pins are absolutely positioned children of `<body>`, so their coordinates are relative
 * to body's padding box rather than the document origin. Those differ whenever body has a
 * margin (the browser default is 8px) or a border, which would offset every pin.
 */
export function getPinContainerOrigin(): Point {
  const body = document.body;
  if (!body) return { x: 0, y: 0 };
  const rect = body.getBoundingClientRect();
  const style = getComputedStyle(body);
  return {
    x: rect.left + window.scrollX + (parseFloat(style.borderLeftWidth) || 0),
    y: rect.top + window.scrollY + (parseFloat(style.borderTopWidth) || 0),
  };
}

/** Scroll the page so an anchor's pin is vertically centered. */
export function scrollToPin(anchor: Anchor): void {
  const { y } = resolveAnchorPagePosition(anchor);
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const target = Math.max(0, Math.min(y - window.innerHeight / 2, maxScroll));
  window.scrollTo({ top: target, behavior: "smooth" });
}
