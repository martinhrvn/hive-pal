import type { Resource } from 'i18next';

/**
 * Single source of truth for the public, SEO-indexed pages.
 *
 * Consumed by:
 *  - `routes.ts` (the route table, under `/` and `/:lang`),
 *  - `public-routes.server.ts` (which public route × language pairs get
 *    prerendered at build time, and the sitemap),
 *  - `language-utils.ts` (canonical URL / hreflang decisions at render time).
 *
 * Keep the two lists below in sync with each other; the prerender plan asserts
 * every marker key is a public route.
 */

/** Language-neutral public paths that are prerendered to static HTML. */
export const PUBLIC_ROUTES = [
  '/',
  '/features',
  '/tools',
  '/tools/syrup-calculator',
  '/tools/brood-timeline',
  '/tools/swarm-management',
  '/tools/swarm-management/demaree',
  '/tools/liebefelder',
  '/tools/varroa-management',
  '/releases',
  '/privacy-policy',
] as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[number];

export interface TranslationMarker {
  readonly ns: string;
  readonly key: string;
}

/**
 * Per-page marker that decides whether a *localized* variant of a public page
 * is worth emitting. A localized URL is only generated (file + sitemap entry +
 * hreflang) when that page actually has a translation for the language;
 * otherwise it would render the English fallback and become a near-duplicate of
 * the canonical English page, which Google reports as "crawled, currently not
 * indexed". English (the default) is always generated.
 *
 * `{ ns, key }` points at a representative *prose* leaf key of the page
 * (intro/lede/description, never a proper-noun title like "Demaree Method" that
 * is identical across languages). A value identical to English is treated as an
 * untranslated placeholder. `null` means the page is English-only (e.g. the
 * language-neutral release notes, or pages with no translations yet).
 */
export const PUBLIC_PAGE_TRANSLATION_MARKERS: Record<
  PublicRoute,
  TranslationMarker | null
> = {
  '/': { ns: 'common', key: 'marketing.landing.hero.lede' },
  '/features': { ns: 'common', key: 'marketing.features.hero.lede' },
  '/tools': { ns: 'common', key: 'marketing.toolsIndex.intro' },
  '/tools/syrup-calculator': { ns: 'common', key: 'syrupCalculator.intro' },
  '/tools/brood-timeline': { ns: 'common', key: 'broodTimeline.intro' },
  '/tools/swarm-management': { ns: 'common', key: 'swarmManagement.intro' },
  '/tools/swarm-management/demaree': {
    ns: 'common',
    key: 'swarmManagement.demaree.description',
  },
  '/tools/liebefelder': { ns: 'common', key: 'liebefelder.intro' },
  '/tools/varroa-management': { ns: 'common', key: 'varroaManagement.intro' },
  '/releases': null,
  '/privacy-policy': null,
};

/**
 * Data a prerendered page hands to the client so hydration reproduces the
 * server markup exactly: the language it was rendered in, the translation
 * bundles that render used, and the languages the page is really available in
 * (which drives the `hreflang` alternates).
 */
export interface PrerenderPayload {
  /** Language-neutral path of the prerendered page, e.g. '/tools'. */
  readonly path: string;
  /** Language the page was rendered in. */
  readonly lang: string;
  /** Languages this page is emitted in (English plus genuine translations). */
  readonly availableLangs: readonly string[];
  /** i18next resource bundles used by the render, keyed by language then namespace. */
  readonly resources: Resource;
}

/** Name of the global the prerendered HTML stores its {@link PrerenderPayload} in. */
export const PRERENDER_GLOBAL = '__HP_PRERENDER__';
