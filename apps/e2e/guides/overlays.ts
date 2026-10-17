/**
 * HTML for `page.screencast.showOverlay`. Overlays are positioned in viewport
 * coordinates and are `pointer-events: none`, so they never block the page.
 */

export type Box = { x: number; y: number; width: number; height: number };
export type Viewport = { width: number; height: number };

const ACCENT = '#f59e0b';
const FONT =
  "font-family: Inter, 'Segoe UI', Roboto, system-ui, sans-serif; line-height: 1.35;";
const BUBBLE =
  `${FONT} padding: 12px 18px; border-radius: 12px; background: rgba(23, 23, 23, 0.92);` +
  ` color: #fff; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35); white-space: pre-line;`;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fontSize(viewport: Viewport): number {
  return viewport.width < 600 ? 18 : 22;
}

/** Burned-in subtitle at the bottom of the frame. */
export function captionBar(text: string, viewport: Viewport): string {
  const maxWidth = Math.min(900, viewport.width - 32);
  return `<div style="position: absolute; left: 50%; bottom: 28px; transform: translateX(-50%);
    width: max-content; max-width: ${maxWidth}px; text-align: center;
    font-size: ${fontSize(viewport)}px; ${BUBBLE} border-bottom: 3px solid ${ACCENT};">${escapeHtml(text)}</div>`;
}

/** Ring around an element without dimming the page (used while acting). */
export function highlightRing(box: Box, viewport: Viewport): string {
  const b = padBox(box, 6, viewport);
  return `<div style="position: absolute; left: ${b.x}px; top: ${b.y}px; width: ${b.width}px; height: ${b.height}px;
    border-radius: 10px; box-shadow: 0 0 0 3px ${ACCENT}, 0 0 18px 4px rgba(245, 158, 11, 0.6);"></div>`;
}

/**
 * Dimmed backdrop with a cut-out around `box` and a caption bubble placed
 * below the element, or above it when there is no room below, or pinned to
 * the bottom of the frame for elements taller than the viewport.
 */
export function spotlight(box: Box, text: string, viewport: Viewport): string {
  const b = padBox(box, 8, viewport);
  const size = fontSize(viewport);
  const gap = 14;
  const maxWidth = Math.min(460, viewport.width - 32);
  // Rough height of a two-line bubble; good enough to choose a side.
  const bubbleHeight =
    Math.ceil(text.length / (maxWidth / (size * 0.55))) * size * 1.35 + 30;

  let vertical: string;
  if (b.y + b.height + gap + bubbleHeight <= viewport.height - 8) {
    vertical = `top: ${b.y + b.height + gap}px;`;
  } else if (b.y - gap - bubbleHeight >= 8) {
    vertical = `bottom: ${viewport.height - b.y + gap}px;`;
  } else {
    vertical = `bottom: 28px;`;
  }
  const centre = b.x + b.width / 2;
  const left = Math.min(
    Math.max(centre, 16 + maxWidth / 2),
    viewport.width - 16 - maxWidth / 2,
  );

  // Four dimmed panels around the cut-out.
  const dim = (x: number, y: number, w: number, h: number) =>
    `<div style="position: absolute; left: ${x}px; top: ${y}px; width: ${w}px; height: ${h}px; background: #0a0a0a; opacity: 0.6;"></div>`;
  const right = b.x + b.width;
  const bottom = b.y + b.height;
  return `<div style="position: absolute; inset: 0; overflow: hidden;">
    ${dim(0, 0, viewport.width, b.y)}
    ${dim(0, bottom, viewport.width, viewport.height - bottom)}
    ${dim(0, b.y, b.x, b.height)}
    ${dim(right, b.y, viewport.width - right, b.height)}
    <div style="position: absolute; left: ${b.x}px; top: ${b.y}px; width: ${b.width}px; height: ${b.height}px;
      border-radius: 6px; box-shadow: 0 0 0 3px ${ACCENT};"></div>
    <div style="position: absolute; ${vertical} left: ${left}px; transform: translateX(-50%);
      width: max-content; max-width: ${maxWidth}px; font-size: ${size}px; ${BUBBLE}
      border-left: 4px solid ${ACCENT};">${escapeHtml(text)}</div>
  </div>`;
}

/** Grow the box by `pad` and clip it to the viewport. */
function padBox(box: Box, pad: number, viewport: Viewport): Box {
  const x = Math.max(4, box.x - pad);
  const y = Math.max(4, box.y - pad);
  const right = Math.min(viewport.width - 4, box.x + box.width + pad);
  const bottom = Math.min(viewport.height - 4, box.y + box.height + pad);
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(right - x),
    height: Math.round(bottom - y),
  };
}
