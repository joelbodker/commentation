/**
 * DOM anchoring utilities for pin placement and lookup.
 * v1: viewport-relative xPercent/yPercent + simple CSS path (tag + nth-child or id).
 * Can be upgraded later with more robust selectors (e.g. unique-id schemes, rangy).
 */

export type Anchor = {
  selector: string;
  xPercent: number;
  yPercent: number;
};

/**
 * Build a simple CSS selector for the given element.
 * Prefers id; otherwise tag + nth-child chain from body.
 */
export function buildSelector(el: Element): string {
  if (el.id && /^[a-zA-Z][\w-]*$/.test(el.id)) {
    return `#${el.id}`;
  }
  const path: string[] = [];
  let current: Element | null = el;
  while (current && current !== document.body) {
    let sel = current.tagName.toLowerCase();
    if (current.id && /^[a-zA-Z][\w-]*$/.test(current.id)) {
      path.unshift(`#${current.id}`);
      break;
    }
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (n) => n.tagName === current!.tagName
      );
      const idx = siblings.indexOf(current as Element) + 1;
      if (siblings.length > 1) sel += `:nth-of-type(${idx})`;
    }
    path.unshift(sel);
    current = parent;
  }
  return path.join(" > ");
}

/**
 * Compute viewport-relative percent (0–100) from a click event.
 */
export function eventToPercent(event: MouseEvent): { xPercent: number; yPercent: number } {
  return {
    xPercent: (event.clientX / window.innerWidth) * 100,
    yPercent: (event.clientY / window.innerHeight) * 100,
  };
}

/**
 * Convert xPercent/yPercent back to fixed pixel positions for overlay.
 * Uses viewport dimensions so pins stay fixed on scroll (top/left in % of viewport).
 */
export function percentToFixedStyle(
  xPercent: number,
  yPercent: number
): { left: string; top: string } {
  return {
    left: `${xPercent}vw`,
    top: `${yPercent}vh`,
  };
}

/**
 * Convert thread anchor data to viewport pixel positions for the fixed pins overlay.
 * Pins must appear exactly where the user clicked, anchored to the element.
 *
 * When selector resolves: use element rect + offsetRatioX/Y for exact click position.
 * offsetRatioX/Y are 0–1 (click position within element). Fall back to center when missing.
 */
export function percentToAbsoluteStyle(
  xPercent: number,
  yPercent: number,
  selector?: string,
  offsetRatioX?: number,
  offsetRatioY?: number
): { left: string; top: string } {
  if (selector) {
    try {
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        const w = Math.max(rect.width, 1);
        const h = Math.max(rect.height, 1);
        const ox = typeof offsetRatioX === "number" ? offsetRatioX : 0.5;
        const oy = typeof offsetRatioY === "number" ? offsetRatioY : 0.5;
        // Pin CSS uses margin-left/top: -14px for centering, so left/top should be the center point
        const left = rect.left + ox * w;
        const top = rect.top + oy * h;
        return { left: `${left}px`, top: `${top}px` };
      }
    } catch {
      /* selector invalid or element not found */
    }
  }

  const viewportX = (xPercent / 100) * window.innerWidth;
  const viewportY = (yPercent / 100) * window.innerHeight;
  const pinX = viewportX - window.scrollX;
  const pinY = viewportY - window.scrollY;
  return { left: `${pinX}px`, top: `${pinY}px` };
}

/**
 * Scroll the page so the pin’s Y position is in view (smooth).
 */
export function scrollToPinY(yPercent: number, selector?: string): void {
  if (selector) {
    try {
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        const docY = rect.top + window.scrollY;
        const centerY = docY - window.innerHeight / 2 + rect.height / 2;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const targetScroll = Math.max(0, Math.min(centerY, maxScroll));
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
        return;
      }
    } catch {
      // selector invalid or element not found, fall through to fallback
    }
  }
  // Fallback: scroll so pin is roughly centered (yPercent was viewport position at creation)
  const y = (yPercent / 100) * window.innerHeight;
  const targetScroll = Math.max(0, y - window.innerHeight / 2);
  window.scrollTo({ top: targetScroll, behavior: "smooth" });
}
