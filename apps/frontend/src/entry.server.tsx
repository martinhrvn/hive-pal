/**
 * Server entry. Hive Pal runs with `ssr: false`, so this only executes at build
 * time (and in `react-router dev`): once for the SPA shell and once per
 * prerendered public page × language.
 *
 * For a prerendered page it renders with a fresh, synchronous i18next instance
 * holding that language's translation bundles (plus the English fallback) read
 * from `public/locales`, and embeds the bundles the render actually used into
 * the HTML as `window.__HP_PRERENDER__`, so the client hydrates with the exact
 * same translations instead of fetching them first (see lib/i18n.ts).
 */
import path from 'node:path';
import { PassThrough } from 'node:stream';
import type { ReactElement } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { ServerRouter, type EntryContext } from 'react-router';
import i18next, { type Resource, type ResourceLanguage } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { PrerenderContext } from '@/context/prerender-context';
import {
  PRERENDER_GLOBAL,
  type PrerenderPayload,
} from '@/routes/public-routes';
import {
  buildPrerenderPlan,
  findPrerenderPage,
  resourcesFor,
  type PrerenderPlan,
} from '@/routes/public-routes.server';
import { DEFAULT_LANGUAGE } from '@/utils/language-utils';

// `react-router build`/`dev` run from the frontend package directory.
const LOCALES_DIR = path.resolve(process.cwd(), 'public', 'locales');

let cachedPlan: PrerenderPlan | undefined;
function getPlan(): PrerenderPlan {
  cachedPlan ??= buildPrerenderPlan(LOCALES_DIR);
  return cachedPlan;
}

/**
 * A fresh, fully-synchronous i18next instance for one render. Translations are
 * passed in as already-loaded resources rather than fetched over HTTP, and
 * `initImmediate: false` makes init synchronous so the caller can render
 * immediately. `useSuspense: false` avoids Suspense on the server.
 */
function createServerI18n(lang: string, resources: Resource) {
  const instance = i18next.createInstance();
  const namespaces = Object.keys(
    (resources[lang] ?? resources[DEFAULT_LANGUAGE] ?? {}) as object,
  );
  instance.use(initReactI18next).init({
    lng: lang,
    fallbackLng: DEFAULT_LANGUAGE,
    ns: namespaces.length > 0 ? namespaces : ['common'],
    defaultNS: 'common',
    resources,
    interpolation: { escapeValue: false },
    initImmediate: false,
    react: { useSuspense: false },
  });
  return instance;
}

/** react-i18next records the namespaces `useTranslation` asked for during a render. */
interface NamespaceReporter {
  reportNamespaces?: { getUsedNamespaces(): string[] };
}

/**
 * Renders the document to a string once every Suspense boundary has resolved.
 * React Router streams the router state into the page from inside a boundary,
 * so `renderToString` would leave the client waiting for it forever; the
 * streaming renderer with `onAllReady` is what the framework's default entry
 * uses as well.
 */
function renderDocument(element: ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => abort(), 10_000);
    const { pipe, abort } = renderToPipeableStream(element, {
      onAllReady() {
        clearTimeout(timeout);
        const chunks: Buffer[] = [];
        const sink = new PassThrough();
        sink.on('data', chunk => chunks.push(Buffer.from(chunk)));
        sink.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        sink.on('error', reject);
        pipe(sink);
      },
      onShellError(error) {
        clearTimeout(timeout);
        reject(error);
      },
      onError(error) {
        console.error(error);
      },
    });
  });
}

/** JSON that is safe to embed inside a <script> element. */
function serialize(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  const url = new URL(request.url);
  const page = routerContext.isSpaMode
    ? undefined
    : findPrerenderPage(getPlan(), url.pathname);

  let html: string;
  let injected = '';

  if (page) {
    const resources = resourcesFor(getPlan(), page.lang);
    const i18n = createServerI18n(page.lang, resources);
    const context: PrerenderPayload = {
      path: page.neutral,
      lang: page.lang,
      availableLangs: page.availableLangs,
      resources: {},
    };

    html = await renderDocument(
      <PrerenderContext.Provider value={context}>
        <I18nextProvider i18n={i18n}>
          <ServerRouter context={routerContext} url={request.url} />
        </I18nextProvider>
      </PrerenderContext.Provider>,
    );

    // Ship only the namespaces this page rendered with, for the page language
    // and the English fallback.
    const used = (
      i18n as unknown as NamespaceReporter
    ).reportNamespaces?.getUsedNamespaces() ?? ['common'];
    const shipped: Resource = {};
    for (const lang of Object.keys(resources)) {
      const bundles: ResourceLanguage = {};
      for (const ns of used) {
        // An empty bundle for a namespace the language lacks keeps the client
        // init synchronous (nothing to fetch) and falls back to English, which
        // is exactly what the server render did.
        bundles[ns] = resources[lang]?.[ns] ?? {};
      }
      shipped[lang] = bundles;
    }
    injected = `<script>window.${PRERENDER_GLOBAL}=${serialize({ ...context, resources: shipped })};</script>`;
  } else {
    html = await renderDocument(
      <ServerRouter context={routerContext} url={request.url} />,
    );
  }

  if (injected) html = html.replace('</head>', `${injected}</head>`);
  // React serializes the JSX `hrefLang` prop verbatim; emit the canonical
  // lowercase `hreflang` attribute in the static HTML.
  html = html.replace(/ hrefLang=/g, ' hreflang=');
  if (!html.startsWith('<!DOCTYPE')) html = `<!DOCTYPE html>${html}`;
  responseHeaders.set('Content-Type', 'text/html');
  return new Response(html, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
