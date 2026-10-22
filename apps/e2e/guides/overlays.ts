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
  | {
      op: 'caption';
      text: string;
      maxWidth: number;
      fontSize: number;
      bottom: number;
    }
  | { op: 'ring'; box: Box }
  /** Move the cursor to a point; `click` adds a ripple when it arrives. */
  | { op: 'cursor'; x: number; y: number; click: boolean }
  /** Full-screen Hive Pal card: the intro, or a chapter title. */
  | {
      op: 'card';
      kind: 'intro' | 'chapter';
      title: string;
      description?: string;
      titleSize: number;
      textSize: number;
      /** Show without fading in: the first frame of a video. */
      instant?: boolean;
    }
  | {
      op: 'hide';
      parts: ('spot' | 'caption' | 'ring' | 'cursor' | 'card')[];
    };

function fontSize(viewport: Viewport): number {
  return viewport.width < 600 ? 18 : 22;
}

/**
 * Space kept free at the bottom of the frame. In a portrait (Shorts) video
 * YouTube lays the title, channel and buttons over the lower part of the
 * frame, so captions stay above it there.
 */
export function bottomInset(viewport: Viewport): number {
  return viewport.height > viewport.width
    ? Math.round(viewport.height * 0.28)
    : 28;
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
  // the bottom of the frame for elements taller than the viewport. All of
  // it above the bottom inset.
  const inset = bottomInset(viewport);
  let vertical: { top?: number; bottom?: number };
  if (hole.y + hole.height + gap + bubbleHeight <= viewport.height - inset) {
    vertical = { top: hole.y + hole.height + gap };
  } else if (hole.y - gap - bubbleHeight >= 8) {
    vertical = { bottom: viewport.height - hole.y + gap };
  } else {
    vertical = { bottom: inset };
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
    bottom: bottomInset(viewport),
  };
}

/** The intro or a chapter card, sized for the viewport. */
export function cardCommand(
  card: {
    kind: 'intro' | 'chapter';
    title: string;
    description?: string;
    instant?: boolean;
  },
  viewport: Viewport,
): StageCommand {
  const narrow = viewport.width < 600;
  return {
    op: 'card',
    ...card,
    titleSize: narrow ? 38 : card.kind === 'intro' ? 64 : 72,
    textSize: narrow ? 18 : 24,
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
      /* Hive Pal card: the marketing site's forest section (hexagons in
         honey, soft amber and emerald glows, Bricolage Grotesque + Manrope). */
      #card {
        inset: 0; overflow: hidden; background: #15201e; color: #fffbeb;
        font-family: Manrope, ui-sans-serif, system-ui, sans-serif;
        transition: opacity ${timing.fade * 1.5}ms ${ease};
      }
      #card .hex {
        position: absolute; inset: -64px; opacity: 0.07;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='64' viewBox='0 0 56 64'><path d='M28 2l24 14v32L28 62 4 48V16L28 2z' fill='none' stroke='%23E8C76A' stroke-width='1'/></svg>");
        background-size: 56px 64px; animation: card-drift 24s linear infinite;
      }
      @keyframes card-drift { to { translate: 56px 64px; } }
      #card .glow { position: absolute; border-radius: 50%; }
      /* Radial gradients, not blur(): a blurred layer gets hard clipped edges
         in the captured frames. */
      #card .glow.amber {
        width: 70vmax; height: 70vmax; top: -32vmax; right: -24vmax;
        background: radial-gradient(closest-side, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0));
        animation: card-breathe 9s ease-in-out infinite alternate;
      }
      #card .glow.emerald {
        width: 80vmax; height: 80vmax; bottom: -40vmax; left: -28vmax;
        background: radial-gradient(closest-side, rgba(16, 185, 129, 0.16), rgba(16, 185, 129, 0));
        animation: card-breathe 11s ease-in-out infinite alternate-reverse;
      }
      @keyframes card-breathe { from { scale: 0.92; } to { scale: 1.08; } }
      #card .body {
        position: absolute; inset: 0; display: flex; flex-direction: column;
        justify-content: center; padding: 0 9%; gap: 0.9em;
      }
      #card.intro .body { align-items: center; text-align: center; }
      #card .rise {
        opacity: 0; translate: 0 18px;
        transition: opacity 600ms ${ease}, translate 600ms ${ease};
      }
      #card.on .rise { opacity: 1; translate: 0 0; }
      #card.on .rise:nth-child(2) { transition-delay: 120ms; }
      #card.on .rise:nth-child(3) { transition-delay: 240ms; }
      #card.on .rise:nth-child(4) { transition-delay: 360ms; }
      #card .logo { width: 7em; height: auto; filter: drop-shadow(0 12px 30px rgba(0, 0, 0, 0.35)); }
      #card.chapter .logo { display: none; }
      #card .brand {
        display: flex; align-items: center; gap: 0.7em;
        font-size: 0.62em; font-weight: 600; letter-spacing: 0.14em;
        text-transform: uppercase; color: rgba(253, 230, 138, 0.8);
      }
      #card .brand img { width: 1.9em; height: auto; }
      #card.intro .brand img { display: none; }
      #card .title {
        margin: 0; max-width: 16em; line-height: 1.05; color: #fffbeb;
        font-family: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif;
        font-variation-settings: 'opsz' 96, 'wdth' 100, 'wght' 600; letter-spacing: -0.02em;
      }
      #card .desc { margin: 0; max-width: 30em; line-height: 1.45; color: rgba(255, 251, 235, 0.75); }
      #card.chapter .desc { position: relative; padding-top: 1em; }
      #card.chapter .desc::before {
        content: ''; position: absolute; left: 0; top: 0;
        width: 3em; height: 3px; border-radius: 2px; background: #fbbf24;
      }
      #card .desc:empty { display: none; }
    </style>
    <div id="hole" class="layer"></div>
    <div id="ring" class="layer"></div>
    <div id="tip" class="layer bubble"></div>
    <div id="caption" class="layer bubble"></div>
    <div id="card" class="layer">
      <div class="hex"></div><div class="glow amber"></div><div class="glow emerald"></div>
      <div class="body">
        <img class="logo rise" src="/hive-pal-logo.png" alt="" />
        <div class="brand rise"><img src="/hive-pal-logo.png" alt="" />Hive Pal</div>
        <div class="title rise"></div>
        <p class="desc rise"></p>
      </div>
    </div>
    <div id="cursor" class="layer">
      <div id="ripple"></div>
      <svg viewBox="0 0 24 24"><path d="M4 2 L4 20 L9 15.5 L12.5 22.5 L15.5 21 L12 14 L19 14 Z"
        fill="#fff" stroke="#171717" stroke-width="1.5" stroke-linejoin="round"/></svg>
    </div>`;
    document.documentElement.appendChild(host);
    state = { root };
    w.__guideStage = state;
  }

  /** Brand fonts (into the document: shadow roots use its @font-face) and the logo. */
  const loadCardAssets = async (card: HTMLElement) => {
    const id = 'hive-pal-guide-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,300..800&family=Manrope:wght@400;600&display=block';
      const loaded = new Promise(r => {
        link.onload = r;
        link.onerror = r;
      });
      document.head.appendChild(link);
      await Promise.race([loaded, sleep(4000)]);
    }
    await Promise.race([
      Promise.all([
        document.fonts.load("600 72px 'Bricolage Grotesque'"),
        document.fonts.load('400 24px Manrope'),
        document.fonts.load('600 16px Manrope'),
        ...[...card.querySelectorAll('img')].map(img =>
          img.decode().catch(() => {}),
        ),
      ]),
      sleep(4000),
    ]);
  };

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
          caption.style.bottom = `${cmd.bottom}px`;
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
    case 'card': {
      const card = el('card');
      const body = card.querySelector('.body') as HTMLElement;
      // Already up (the intro is shown before the video starts).
      if (
        isOn(card) &&
        card.classList.contains(cmd.kind) &&
        card.querySelector('.title')?.textContent === cmd.title
      )
        return Promise.resolve();
      const fill = () => {
        card.className = `layer ${cmd.kind}`;
        body.style.fontSize = `${cmd.textSize}px`;
        const title = card.querySelector('.title') as HTMLElement;
        title.textContent = cmd.title;
        title.style.fontSize = `${cmd.titleSize}px`;
        (card.querySelector('.desc') as HTMLElement).textContent =
          cmd.description ?? '';
      };
      return loadCardAssets(card).then(() => {
        if (cmd.instant) {
          // Straight to the finished state, no transitions.
          const all = [card, ...card.querySelectorAll<HTMLElement>('.rise')];
          all.forEach(e => (e.style.transition = 'none'));
          fill();
          card.classList.add('on');
          void card.offsetWidth;
          all.forEach(e => (e.style.transition = ''));
          return;
        }
        jump(card, fill);
        show(card);
        return sleep(timing.fade * 1.5 + 600);
      });
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
      if (cmd.parts.includes('card')) {
        hide(el('card'));
        return sleep(timing.fade * 1.5);
      }
      return sleep(timing.fade);
    }
  }
}
