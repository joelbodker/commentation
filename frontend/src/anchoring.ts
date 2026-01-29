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
 * Convert viewport-relative percentages to page-relative positions that scroll with the page.
 * Since pinsLayer is fixed, we need to calculate the position relative to the fixed container.
 * 
 * The stored xPercent/yPercent represent viewport position at creation time.
 * To make pins scroll with content, we calculate: viewport_position - scroll_offset.
 * This makes pins appear to move with the page as you scroll.
 */
export function percentToAbsoluteStyle(
  xPercent: number,
  yPercent: number,
  selector?: string
): { left: string; top: string } {
  // Convert viewport percentages to current viewport pixels
  const viewportX = (xPercent / 100) * window.innerWidth;
  const viewportY = (yPercent / 100) * window.innerHeight;
  
  // To make pins scroll with the page content:
  // - At creation: pin was at viewport position (viewportX, viewportY) when scroll was (sx0, sy0)
  // - Page position = viewportX + sx0, viewportY + sy0 (constant)
  // - At render: to show at same page position, viewport position should be: pageX - scrollX
  // - Since we don't know sx0, we approximate: assume pin should stay at same viewport position
  // - But to make it scroll, we subtract current scroll offset
  // This makes pins move opposite to scroll direction, appearing to scroll with content
  
  const pinX = viewportX - window.scrollX;
  const pinY = viewportY - window.scrollY;
  
  return {
    left: `${pinX}px`,
    top: `${pinY}px`,
  };
}

/**
 * Scroll the page so the pin’s Y position is in view (smooth).
 */
export function scrollToPinY(yPercent: number): void {
  const y = (yPercent / 100) * window.innerHeight;
  window.scrollTo({ top: y, behavior: "smooth" });
}
