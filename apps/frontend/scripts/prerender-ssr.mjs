// Build-time prerenderer for Hive Pal's public, multilingual pages.
//
// Runs after the client build (`vite build`) and the SSR build
// (`vite build --ssr src/entry-server.tsx --outDir dist-ssr`). For every public
// route × language it calls the SSR `render()` to produce localized HTML
// (correct text, <html lang>, canonical, hreflang) and writes it into flat
// `.html` files in dist/, plus a localized sitemap.xml. No browser involved —
// it's a plain Node render.
//
// The backend serves these flat files via `serveStaticOptions: { extensions:
// ['html'] }` (see apps/backend/src/app.module.ts), falling back to the SPA
// shell for everything else.

import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SSR_ENTRY = path.join(ROOT, 'dist-ssr', 'entry-server.js');
const LOCALES_DIR = path.join(DIST, 'locales');

const SITE_URL = 'https://hivepal.app';
const DEFAULT_LANGUAGE = 'en';

// Language-neutral public paths to prerender. Mirror the public routes in
// src/routes/public-route-config.tsx and src/routes/index.tsx.
const PUBLIC_ROUTES = [
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
];

// Unprefixed-only URLs kept in the sitemap (not prerendered/localized).
// Auth pages (/login, /register) are intentionally excluded: they render only
// the SPA shell, so advertising them invites "crawled, not indexed" verdicts.
const EXTRA_SITEMAP_ROUTES = [];

// Per-route marker that decides whether a *localized* variant is worth emitting.
// A localized URL is only generated (file + sitemap entry + hreflang) when that
// page actually has a translation for the language; otherwise it would render the
// English fallback and become a near-duplicate of the canonical English page —
// which Google reports as "crawled, currently not indexed". English (the default)
// is always generated. `{ ns, key }` points at the page's translation subtree in
// the loaded namespace bundle; `null` means the page is English-only (e.g. the
// language-neutral release notes, or pages with no translations yet).
// A representative *prose* leaf key per page (intro/lede/description — never a
// proper-noun title like "Demaree Method" that is identical across languages).
// `hasTranslation` compares its value to English, so a translated intro reliably
// marks the page as localized while an English placeholder does not. Keep in sync
// with PUBLIC_PAGE_TRANSLATION_MARKERS in src/utils/language-utils.ts.
const ROUTE_TRANSLATION_MARKERS = {
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

function getNestedKey(obj, keyPath) {
  return keyPath
    .split('.')
    .reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

// True if `namespaces` has a real translation at the marker key — i.e. a
// non-empty value that differs from the English source. A value identical to
// English is an untranslated placeholder (common while Weblate catches up) and is
// treated as not translated, so we don't emit an English near-duplicate.
function hasTranslation(namespaces, enNamespaces, marker) {
  if (!marker) return false;
  const value = getNestedKey(namespaces?.[marker.ns], marker.key);
  if (value == null || value === '') return false;
  return value !== getNestedKey(enNamespaces?.[marker.ns], marker.key);
}

// The languages a route should be emitted in: English always, plus every other
// language that genuinely translates the page.
function availableLanguagesForRoute(neutral, languages, namespacesByLang) {
  const marker = ROUTE_TRANSLATION_MARKERS[neutral];
  const en = namespacesByLang[DEFAULT_LANGUAGE];
  return languages.filter(
    lang =>
      lang === DEFAULT_LANGUAGE ||
      hasTranslation(namespacesByLang[lang], en, marker),
  );
}

function localizedPath(neutralPath, lang) {
  if (lang === DEFAULT_LANGUAGE) return neutralPath;
  return neutralPath === '/' ? `/${lang}` : `/${lang}${neutralPath}`;
}

// '/' -> dist/index.html, '/x/y' -> dist/x/y.html
function outputFile(urlPath) {
  if (urlPath === '/') return path.join(DIST, 'index.html');
  return path.join(DIST, `${urlPath.replace(/^\//, '')}.html`);
}

// In-app register variants (e.g. `de-informal`) live as their own locale
// directory but must not be prerendered as public, indexable pages — they share
// the canonical language's URLs. Keep them out of language discovery.
const NON_PUBLIC_LOCALES = new Set(['de-informal']);

async function discoverLanguages() {
  const entries = await readdir(LOCALES_DIR, { withFileTypes: true });
  const langs = entries
    .filter(e => e.isDirectory() && !NON_PUBLIC_LOCALES.has(e.name))
    .map(e => e.name)
    .sort();
  if (!langs.includes(DEFAULT_LANGUAGE)) langs.unshift(DEFAULT_LANGUAGE);
  return langs;
}

// Read all namespace JSON files for a language into { ns: data }.
async function loadNamespaces(lang) {
  const dir = path.join(LOCALES_DIR, lang);
  const files = await readdir(dir);
  const bundle = {};
  for (const file of files) {
    if (file.endsWith('.json')) {
      const ns = file.slice(0, -'.json'.length);
      bundle[ns] = JSON.parse(await readFile(path.join(dir, file), 'utf-8'));
    }
  }
  return bundle;
}

// Restore a pristine template even if index.html was already prerendered in a
// previous run (the '/' output overwrites the template file). Removes injected
// Helmet tags and empties #root so the script is idempotent.
function cleanTemplate(html) {
  return html
    .replace(/<title data-rh="true">[\s\S]*?<\/title>/g, '<title></title>')
    .replace(/<script data-rh="true"[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<(meta|link) data-rh="true"[^>]*>/g, '')
    .replace(
      /<div id="root">[\s\S]*?<\/div>\s*<script src="\/env\.js">/,
      '<div id="root"></div>\n    <script src="/env.js">',
    );
}

// Drop `hreflang` alternate links for languages this page is not emitted in, so
// the static HTML only advertises real, indexable alternates (reciprocal with the
// sitemap). PublicMeta always renders the full language set; pruning happens here,
// at build time, so the app code stays language-agnostic. `x-default` is kept.
function filterAlternateLinks(html, availableLangs) {
  const keep = new Set([...availableLangs, 'x-default']);
  return html.replace(
    /<link\b[^>]*\brel="alternate"[^>]*>\n?/g,
    match => {
      const lang = /\bhreflang="([^"]+)"/i.exec(match)?.[1];
      return lang && !keep.has(lang) ? '' : match;
    },
  );
}

// Build the page HTML by injecting the SSR output into the client template,
// stripping the template's static SEO tags so they don't duplicate Helmet's.
function buildPage(template, { appHtml, head, htmlAttributes }, availableLangs) {
  let html = template;

  if (htmlAttributes) {
    html = html.replace(/<html[^>]*>/, `<html ${htmlAttributes}>`);
  }

  html = html
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="title"[^>]*>/g, '')
    .replace(/<meta name="description"[^>]*>/g, '')
    .replace(/<meta property="og:[^>]*>/g, '')
    .replace(/<meta property="twitter:[^>]*>/g, '')
    .replace(/<link rel="canonical"[^>]*>/g, '');

  html = html.replace('</head>', `${head}\n</head>`);
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${appHtml}</div>`,
  );
  // react-helmet-async serializes the JSX `hrefLang` prop verbatim; emit the
  // canonical lowercase `hreflang` attribute in the static HTML.
  html = html.replaceAll(' hrefLang=', ' hreflang=');
  if (availableLangs) html = filterAlternateLinks(html, availableLangs);
  return html;
}

function buildSitemap(languages, namespacesByLang) {
  const urlBlocks = PUBLIC_ROUTES.map(neutral => {
    const availableLangs = availableLanguagesForRoute(
      neutral,
      languages,
      namespacesByLang,
    );
    const alternates = [
      ...availableLangs.map(
        lang =>
          `      <xhtml:link rel="alternate" hreflang="${lang}" href="${SITE_URL}${localizedPath(neutral, lang)}" />`,
      ),
      `      <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${localizedPath(neutral, DEFAULT_LANGUAGE)}" />`,
    ].join('\n');
    return availableLangs
      .map(
        lang =>
          `  <url>\n    <loc>${SITE_URL}${localizedPath(neutral, lang)}</loc>\n${alternates}\n  </url>`,
      )
      .join('\n');
  });
  const extras = EXTRA_SITEMAP_ROUTES.map(
    p => `  <url>\n    <loc>${SITE_URL}${p}</loc>\n  </url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${[...urlBlocks, ...extras].join('\n')}\n</urlset>\n`;
}

// Minimal in-memory Web Storage shim. Some modules (e.g. zustand persist stores)
// touch localStorage at import time; renderToString never runs effects, so a
// no-op store is enough to let the SSR bundle load.
function installStorageShim() {
  if (typeof globalThis.localStorage !== 'undefined') return;
  const make = () => {
    const map = new Map();
    return {
      getItem: k => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => map.set(k, String(v)),
      removeItem: k => map.delete(k),
      clear: () => map.clear(),
      key: i => [...map.keys()][i] ?? null,
      get length() {
        return map.size;
      },
    };
  };
  globalThis.localStorage = make();
  globalThis.sessionStorage = make();
}

async function main() {
  installStorageShim();
  const { render } = await import(pathToFileURL(SSR_ENTRY).href);
  const template = cleanTemplate(
    await readFile(path.join(DIST, 'index.html'), 'utf-8'),
  );
  const languages = await discoverLanguages();

  // Preload translation resources once per language (with English fallback).
  const namespacesByLang = {};
  for (const lang of languages) {
    namespacesByLang[lang] = await loadNamespaces(lang);
  }

  console.log(
    `Prerendering ${PUBLIC_ROUTES.length} routes × ${languages.length} languages`,
  );

  // Preloaded i18n resources per language (each with English fallback).
  const resourcesByLang = {};
  for (const lang of languages) {
    resourcesByLang[lang] = { [lang]: namespacesByLang[lang] };
    if (lang !== DEFAULT_LANGUAGE) {
      resourcesByLang[lang][DEFAULT_LANGUAGE] = namespacesByLang[DEFAULT_LANGUAGE];
    }
  }

  let pruned = 0;
  for (const neutral of PUBLIC_ROUTES) {
    // Only emit localized variants for languages that actually translate the page;
    // English-fallback variants are near-duplicates and stay unindexed.
    const availableLangs = availableLanguagesForRoute(
      neutral,
      languages,
      namespacesByLang,
    );
    pruned += languages.length - availableLangs.length;

    for (const lang of availableLangs) {
      const urlPath = localizedPath(neutral, lang);
      const result = render(urlPath, lang, resourcesByLang[lang]);
      const page = buildPage(template, result, availableLangs);
      const outPath = outputFile(urlPath);
      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, page, 'utf-8');
      console.log(`  ✓ ${urlPath}`);
    }
  }
  console.log(
    `Skipped ${pruned} untranslated localized variant(s) (English fallback — left to the canonical page).`,
  );

  await writeFile(
    path.join(DIST, 'sitemap.xml'),
    buildSitemap(languages, namespacesByLang),
    'utf-8',
  );
  console.log('  ✓ sitemap.xml');
}

main().catch(err => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
