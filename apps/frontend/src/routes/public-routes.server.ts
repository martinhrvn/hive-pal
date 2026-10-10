/**
 * Build-time side of the public pages: which route × language pairs are
 * prerendered, the translation bundles each render needs, and the sitemap.
 *
 * `.server.ts` keeps this (and its `node:fs` usage) out of the client bundle.
 * It is used by `react-router.config.ts` (prerender list, build finalization)
 * and `entry.server.tsx` (per-page i18n resources while prerendering).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Resource, ResourceLanguage } from 'i18next';
import {
  PUBLIC_PAGE_TRANSLATION_MARKERS,
  PUBLIC_ROUTES,
  type TranslationMarker,
} from './public-routes';
import {
  DEFAULT_LANGUAGE,
  SITE_URL,
  buildLocalizedPath,
  stripLanguagePrefix,
} from '../utils/language-utils';

/** Translation bundles of one language, keyed by namespace. */
export type LanguageNamespaces = ResourceLanguage;

export interface PrerenderPage {
  /** Language-neutral path, e.g. '/tools/syrup-calculator'. */
  readonly neutral: string;
  readonly lang: string;
  /** The URL that is prerendered, e.g. '/da/tools/syrup-calculator'. */
  readonly path: string;
  /** Every language this page is emitted in (always includes English). */
  readonly availableLangs: readonly string[];
}

export interface PrerenderPlan {
  readonly languages: readonly string[];
  readonly pages: readonly PrerenderPage[];
  readonly namespacesByLang: Readonly<Record<string, LanguageNamespaces>>;
}

/** Languages present under `public/locales`, English first. */
export function discoverLanguages(localesDir: string): string[] {
  const langs = readdirSync(localesDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
  if (!langs.includes(DEFAULT_LANGUAGE)) langs.unshift(DEFAULT_LANGUAGE);
  return langs;
}

/** Reads every `<ns>.json` of a language into `{ ns: data }`. */
export function loadNamespaces(
  localesDir: string,
  lang: string,
): LanguageNamespaces {
  const dir = path.join(localesDir, lang);
  if (!existsSync(dir)) return {};
  const bundle: LanguageNamespaces = {};
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const ns = file.slice(0, -'.json'.length);
    bundle[ns] = JSON.parse(readFileSync(path.join(dir, file), 'utf-8'));
  }
  return bundle;
}

function getNestedKey(obj: unknown, keyPath: string): unknown {
  return keyPath
    .split('.')
    .reduce<unknown>(
      (acc, k) =>
        acc != null && typeof acc === 'object'
          ? (acc as Record<string, unknown>)[k]
          : undefined,
      obj,
    );
}

/**
 * True if `namespaces` holds a real translation at the marker key: a non-empty
 * value that differs from the English source. A value identical to English is
 * an untranslated placeholder (common while Weblate catches up).
 */
export function hasTranslation(
  namespaces: LanguageNamespaces | undefined,
  enNamespaces: LanguageNamespaces | undefined,
  marker: TranslationMarker | null,
): boolean {
  if (!marker) return false;
  const value = getNestedKey(namespaces?.[marker.ns], marker.key);
  if (value == null || value === '') return false;
  return value !== getNestedKey(enNamespaces?.[marker.ns], marker.key);
}

/**
 * Computes the full prerender plan from the locale files on disk: every public
 * route in English, plus each language that genuinely translates the page.
 */
export function buildPrerenderPlan(localesDir: string): PrerenderPlan {
  const languages = discoverLanguages(localesDir);
  const namespacesByLang: Record<string, LanguageNamespaces> = {};
  for (const lang of languages) {
    namespacesByLang[lang] = loadNamespaces(localesDir, lang);
  }
  const en = namespacesByLang[DEFAULT_LANGUAGE];

  const pages: PrerenderPage[] = [];
  for (const neutral of PUBLIC_ROUTES) {
    const marker = PUBLIC_PAGE_TRANSLATION_MARKERS[neutral];
    const availableLangs = languages.filter(
      lang =>
        lang === DEFAULT_LANGUAGE ||
        hasTranslation(namespacesByLang[lang], en, marker),
    );
    for (const lang of availableLangs) {
      pages.push({
        neutral,
        lang,
        path: buildLocalizedPath(neutral, lang),
        availableLangs,
      });
    }
  }

  return { languages, pages, namespacesByLang };
}

/** Finds the plan entry for a URL path, or `undefined` if it is not prerendered. */
export function findPrerenderPage(
  plan: PrerenderPlan,
  urlPath: string,
): PrerenderPage | undefined {
  const normalized = urlPath.length > 1 ? urlPath.replace(/\/+$/, '') : urlPath;
  return plan.pages.find(page => page.path === normalized);
}

/**
 * i18next `resources` for rendering a page in `lang`: that language's bundles
 * plus the English fallback.
 */
export function resourcesFor(plan: PrerenderPlan, lang: string): Resource {
  const resources: Resource = {
    [lang]: plan.namespacesByLang[lang] ?? {},
  };
  if (lang !== DEFAULT_LANGUAGE) {
    resources[DEFAULT_LANGUAGE] = plan.namespacesByLang[DEFAULT_LANGUAGE] ?? {};
  }
  return resources;
}

/** Localized sitemap listing exactly the prerendered URLs with their alternates. */
export function buildSitemap(plan: PrerenderPlan, siteUrl = SITE_URL): string {
  const urlBlocks = PUBLIC_ROUTES.map(neutral => {
    const pages = plan.pages.filter(page => page.neutral === neutral);
    const availableLangs = pages[0]?.availableLangs ?? [DEFAULT_LANGUAGE];
    const alternates = [
      ...availableLangs.map(
        lang =>
          `      <xhtml:link rel="alternate" hreflang="${lang}" href="${siteUrl}${buildLocalizedPath(neutral, lang)}" />`,
      ),
      `      <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}${buildLocalizedPath(neutral, DEFAULT_LANGUAGE)}" />`,
    ].join('\n');
    return pages
      .map(
        page =>
          `  <url>\n    <loc>${siteUrl}${page.path}</loc>\n${alternates}\n  </url>`,
      )
      .join('\n');
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlBlocks.join('\n')}\n</urlset>\n`;
}

/** Language-neutral form of a prerendered URL path. */
export function neutralPathOf(urlPath: string): string {
  return stripLanguagePrefix(urlPath);
}
