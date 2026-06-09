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
  '/releases',
  '/privacy-policy',
];

// Unprefixed-only URLs kept in the sitemap (not prerendered/localized).
const EXTRA_SITEMAP_ROUTES = ['/login', '/register'];

function localizedPath(neutralPath, lang) {
  if (lang === DEFAULT_LANGUAGE) return neutralPath;
  return neutralPath === '/' ? `/${lang}` : `/${lang}${neutralPath}`;
}

// '/' -> dist/index.html, '/x/y' -> dist/x/y.html
function outputFile(urlPath) {
  if (urlPath === '/') return path.join(DIST, 'index.html');
  return path.join(DIST, `${urlPath.replace(/^\//, '')}.html`);
}

async function discoverLanguages() {
  const entries = await readdir(LOCALES_DIR, { withFileTypes: true });
  const langs = entries.filter(e => e.isDirectory()).map(e => e.name).sort();
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

// Build the page HTML by injecting the SSR output into the client template,
// stripping the template's static SEO tags so they don't duplicate Helmet's.
function buildPage(template, { appHtml, head, htmlAttributes }) {
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
  return html;
}

function buildSitemap(languages) {
  const urlBlocks = PUBLIC_ROUTES.map(neutral => {
    const alternates = [
      ...languages.map(
        lang =>
          `      <xhtml:link rel="alternate" hreflang="${lang}" href="${SITE_URL}${localizedPath(neutral, lang)}" />`,
      ),
      `      <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${localizedPath(neutral, DEFAULT_LANGUAGE)}" />`,
    ].join('\n');
    return languages
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

  for (const lang of languages) {
    const resources = { [lang]: namespacesByLang[lang] };
    if (lang !== DEFAULT_LANGUAGE) {
      resources[DEFAULT_LANGUAGE] = namespacesByLang[DEFAULT_LANGUAGE];
    }

    for (const neutral of PUBLIC_ROUTES) {
      const urlPath = localizedPath(neutral, lang);
      const result = render(urlPath, lang, resources);
      const page = buildPage(template, result);
      const outPath = outputFile(urlPath);
      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, page, 'utf-8');
      console.log(`  ✓ ${urlPath}`);
    }
  }

  await writeFile(path.join(DIST, 'sitemap.xml'), buildSitemap(languages), 'utf-8');
  console.log('  ✓ sitemap.xml');
}

main().catch(err => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
