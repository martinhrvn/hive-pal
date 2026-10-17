import type { Page } from '@playwright/test';

/**
 * The guide's on-screen layer ("stage"): a spotlight, a caption bubble next
 * to it, a bottom caption bar and a highlight ring. Unlike
 * `page.screencast.showOverlay`, whose overlays can only be added or removed,
 * the stage is one element we keep and change, so every change is a CSS
 * transition: things fade in and out, and the spotlight glides from one
 * element to the next.
 *
 * It lives in its own shadow root under <html>, is `aria-hidden` and
 * `pointer-events: none`, so locators never see it and it never blocks
 * clicks. A full page load removes it; the next command re-creates it.
 */

export type Box = { x: number; y: number; width: number; height: number };
export type Viewport = { width: number; height: number };

/** Fade in/out and caption rise. */
export const FADE_MS = 350;
/** Spotlight moving from one element to the next. */
export const GLIDE_MS = 700;
/** How long a finished spotlight stays dimmed, waiting for the next `point`. */
export const LINGER_MS = 1200;
/** Cursor travelling to the element a guide is about to click or type into. */
export const CURSOR_MS = 650;

type BubblePlacement = {
  top?: number;
  bottom?: number;
  left: number;
  maxWidth: number;
  fontSize: number;
};

export type StageCommand =
  | { op: 'spot'; hole: Box; text: string; bubble: BubblePlacement }
  /** Fade out the spot's bubble now and the dimming after LINGER_MS. */
  | { op: 'releaseSpot' }
  | { op: 'caption'; text: string; maxWidth: number; fontSize: number }
  | { op: 'ring'; box: Box }
  /** Move the cursor to a point; `click` adds a ripple when it arrives. */
  | { op: 'cursor'; x: number; y: number; click: boolean }
  | { op: 'hide'; parts: ('spot' | 'caption' | 'ring' | 'cursor')[] };

function fontSize(viewport: Viewport): number {
  return viewport.width < 600 ? 18 : 22;
}

export function spotCommand(
  box: Box,
  text: string,
  viewport: Viewport,
): StageCommand {
  const hole = padBox(box, 8, viewport);
  const size = fontSize(viewport);
  const gap = 14;
  const maxWidth = Math.min(460, viewport.width - 32);
  // Rough height of the bubble; good enough to choose a side.
  const bubbleHeight =
    Math.ceil(text.length / (maxWidth / (size * 0.55))) * size * 1.35 + 30;

  // Below the element, above it when there is no room below, or pinned to
  // the bottom of the frame for elements taller than the viewport.
  let vertical: { top?: number; bottom?: number };
  if (hole.y + hole.height + gap + bubbleHeight <= viewport.height - 8) {
    vertical = { top: hole.y + hole.height + gap };
  } else if (hole.y - gap - bubbleHeight >= 8) {
    vertical = { bottom: viewport.height - hole.y + gap };
  } else {
    vertical = { bottom: 28 };
  }
  const centre = hole.x + hole.width / 2;
  const left = Math.min(
    Math.max(centre, 16 + maxWidth / 2),
    viewport.width - 16 - maxWidth / 2,
  );
  return {
    op: 'spot',
    hole,
    text,
    bubble: { ...vertical, left, maxWidth, fontSize: size },
  };
}

export function captionCommand(text: string, viewport: Viewport): StageCommand {
  return {
    op: 'caption',
    text,
    maxWidth: Math.min(900, viewport.width - 32),
    fontSize: fontSize(viewport),
  };
}

export function ringCommand(box: Box, viewport: Viewport): StageCommand {
  return { op: 'ring', box: padBox(box, 6, viewport) };
}

/**
 * Run a stage command in the page. Resolves once its transition has
 * finished. A navigation racing the command is ignored: the new page simply
 * starts without the stage.
 */
export async function stage(page: Page, cmd: StageCommand): Promise<void> {
  await page
    .evaluate(runStageCommand, {
      cmd,
      timing: {
        fade: FADE_MS,
        glide: GLIDE_MS,
        linger: LINGER_MS,
        cursor: CURSOR_MS,
      },
    })
    .catch(e => {
      if (!/context was destroyed|navigat|Target closed/i.test(String(e)))
        throw e;
    });
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

// ---------------------------------------------------------------------------
// In-page code. Serialized by page.evaluate, so it must not reference anything
// outside its own body.
// ---------------------------------------------------------------------------

type StageArgs = {
  cmd: StageCommand;
  timing: { fade: number; glide: number; linger: number; cursor: number };
};

type StageState = {
  root: ShadowRoot;
  lingerTimer?: number;
};

function runStageCommand({ cmd, timing }: StageArgs): Promise<void> {
  const TAG = 'hive-pal-guide-stage';
  const ACCENT = '#f59e0b';
  const w = window as unknown as { __guideStage?: StageState };
  const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

  let state = w.__guideStage;
  if (!state || !state.root.host.isConnected) {
    const host = document.createElement(TAG);
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText =
      'all: initial; position: fixed; inset: 0; z-index: 2147483646; pointer-events: none;';
    const root = host.attachShadow({ mode: 'open' });
    const ease = 'cubic-bezier(0.4, 0, 0.2, 1)';
    root.innerHTML = `<style>
      * { box-sizing: border-box; }
      .layer { position: absolute; opacity: 0; transition: opacity ${timing.fade}ms ${ease}; }
      .layer.on { opacity: 1; }
      #hole {
        border-radius: 8px;
        box-shadow: 0 0 0 3px ${ACCENT}, 0 0 0 200vmax rgba(10, 10, 10, 0.6);
        transition: opacity ${timing.fade}ms ${ease}, left ${timing.glide}ms ${ease},
          top ${timing.glide}ms ${ease}, width ${timing.glide}ms ${ease}, height ${timing.glide}ms ${ease};
      }
      #ring {
        border-radius: 10px; scale: 0.97;
        box-shadow: 0 0 0 3px ${ACCENT}, 0 0 18px 4px rgba(245, 158, 11, 0.6);
        transition: opacity ${timing.fade}ms ${ease}, scale ${timing.fade}ms ${ease};
      }
      #ring.on { scale: 1; }
      .bubble {
        font-family: Inter, 'Segoe UI', Roboto, system-ui, sans-serif; line-height: 1.35;
        padding: 12px 18px; border-radius: 12px; background: rgba(23, 23, 23, 0.92);
        color: #fff; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35); white-space: pre-line;
        width: max-content; transform: translateX(-50%); translate: 0 10px;
        transition: opacity ${timing.fade}ms ${ease}, translate ${timing.fade}ms ${ease};
      }
      .bubble.on { translate: 0 0; }
      #tip { border-left: 4px solid ${ACCENT}; }
      #caption { left: 50%; bottom: 28px; text-align: center; border-bottom: 3px solid ${ACCENT}; }
      #cursor {
        left: 0; top: 0; width: 26px; height: 26px;
        transition: opacity ${timing.fade}ms ${ease}, translate ${timing.cursor}ms ${ease};
        filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35));
      }
      #cursor svg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
      #ripple {
        position: absolute; left: -16px; top: -16px; width: 32px; height: 32px;
        border-radius: 50%; border: 3px solid ${ACCENT}; opacity: 0;
      }
      #ripple.go { animation: guide-ripple 450ms ease-out; }
      @keyframes guide-ripple {
        from { opacity: 0.9; scale: 0.3; }
        to { opacity: 0; scale: 1.4; }
      }
    </style>
    <div id="hole" class="layer"></div>
    <div id="ring" class="layer"></div>
    <div id="tip" class="layer bubble"></div>
    <div id="caption" class="layer bubble"></div>
    <div id="cursor" class="layer">
      <div id="ripple"></div>
      <svg viewBox="0 0 24 24"><path d="M4 2 L4 20 L9 15.5 L12.5 22.5 L15.5 21 L12 14 L19 14 Z"
        fill="#fff" stroke="#171717" stroke-width="1.5" stroke-linejoin="round"/></svg>
    </div>`;
    document.documentElement.appendChild(host);
    state = { root };
    w.__guideStage = state;
  }

  const { root } = state;
  const el = (id: string) => root.getElementById(id) as HTMLElement;
  const isOn = (e: HTMLElement) => e.classList.contains('on');
  const place = (
    e: HTMLElement,
    b: { x: number; y: number; width: number; height: number },
  ) => {
    e.style.left = `${b.x}px`;
    e.style.top = `${b.y}px`;
    e.style.width = `${b.width}px`;
    e.style.height = `${b.height}px`;
  };
  /** Apply geometry without animating it (for an element that is hidden). */
  const jump = (e: HTMLElement, apply: () => void) => {
    const saved = e.style.transition;
    e.style.transition = 'none';
    apply();
    void e.offsetWidth;
    e.style.transition = saved;
  };
  const show = (e: HTMLElement) => {
    void e.offsetWidth;
    e.classList.add('on');
  };
  const hide = (e: HTMLElement) => e.classList.remove('on');
  const clearLinger = () => {
    if (state!.lingerTimer !== undefined) clearTimeout(state!.lingerTimer);
    state!.lingerTimer = undefined;
  };

  switch (cmd.op) {
    case 'spot': {
      clearLinger();
      const hole = el('hole');
      const tip = el('tip');
      const gliding = isOn(hole);
      if (gliding) place(hole, cmd.hole);
      else jump(hole, () => place(hole, cmd.hole));
      show(hole);
      hide(tip);
      return sleep(gliding ? timing.glide : timing.fade / 2).then(() => {
        jump(tip, () => {
          tip.textContent = cmd.text;
          tip.style.maxWidth = `${cmd.bubble.maxWidth}px`;
          tip.style.fontSize = `${cmd.bubble.fontSize}px`;
          tip.style.left = `${cmd.bubble.left}px`;
          tip.style.top =
            cmd.bubble.top === undefined ? '' : `${cmd.bubble.top}px`;
          tip.style.bottom =
            cmd.bubble.bottom === undefined ? '' : `${cmd.bubble.bottom}px`;
        });
        show(tip);
        return sleep(timing.fade);
      });
    }
    case 'releaseSpot': {
      hide(el('tip'));
      clearLinger();
      state.lingerTimer = window.setTimeout(
        () => hide(el('hole')),
        timing.linger,
      );
      return sleep(timing.fade);
    }
    case 'caption': {
      const caption = el('caption');
      const swap = () => {
        jump(caption, () => {
          caption.textContent = cmd.text;
          caption.style.maxWidth = `${cmd.maxWidth}px`;
          caption.style.fontSize = `${cmd.fontSize}px`;
        });
        show(caption);
        return sleep(timing.fade);
      };
      if (!isOn(caption)) return swap();
      hide(caption);
      return sleep(timing.fade).then(swap);
    }
    case 'ring': {
      const ring = el('ring');
      jump(ring, () => place(ring, cmd.box));
      show(ring);
      return sleep(timing.fade);
    }
    case 'cursor': {
      const cursor = el('cursor');
      const to = `${Math.round(cmd.x)}px ${Math.round(cmd.y)}px`;
      const arrive = () => {
        if (!cmd.click) return Promise.resolve();
        const ripple = el('ripple');
        ripple.classList.remove('go');
        void ripple.offsetWidth;
        ripple.classList.add('go');
        return sleep(200);
      };
      if (!isOn(cursor)) {
        // First appearance: fade in a little above-left of the target.
        jump(cursor, () => {
          cursor.style.translate = `${Math.round(cmd.x) - 60}px ${Math.round(cmd.y) - 40}px`;
        });
        show(cursor);
      } else if (cursor.style.translate === to) {
        return arrive();
      }
      void cursor.offsetWidth;
      cursor.style.translate = to;
      return sleep(timing.cursor).then(arrive);
    }
    case 'hide': {
      const ids = cmd.parts.flatMap(p =>
        p === 'spot' ? ['hole', 'tip'] : [p],
      );
      if (!ids.some(id => isOn(el(id)))) {
        if (cmd.parts.includes('spot')) clearLinger();
        return Promise.resolve();
      }
      if (cmd.parts.includes('spot')) {
        clearLinger();
        hide(el('hole'));
        hide(el('tip'));
      }
      if (cmd.parts.includes('caption')) hide(el('caption'));
      if (cmd.parts.includes('ring')) hide(el('ring'));
      if (cmd.parts.includes('cursor')) hide(el('cursor'));
      return sleep(timing.fade);
    }
  }
}
