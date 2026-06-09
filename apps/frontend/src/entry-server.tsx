import { renderToString } from 'react-dom/server';
import { StaticRouter, useRoutes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import type { HelmetServerState } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Resource } from 'i18next';
import { serverPublicRoutes } from '@/routes/public-route-config';
import { AuthContext } from '@/context/auth-context/auth-context';
import { createServerI18n } from '@/lib/i18n-server';

// Logged-out auth context for prerendering. Public pages read isLoggedIn to show
// the public (signed-out) variant; the action methods are never invoked here.
const SSR_AUTH = {
  user: null,
  isLoggedIn: false,
  isLoading: false,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
};

function RoutedApp() {
  return useRoutes(serverPublicRoutes);
}

export interface PrerenderResult {
  /** Rendered app markup to place inside #root. */
  readonly appHtml: string;
  /** Serialized <head> tags (title, meta, link) from react-helmet-async. */
  readonly head: string;
  /** Serialized <html> attributes (e.g. lang="da"). */
  readonly htmlAttributes: string;
}

/**
 * Renders a public page to static HTML for the given URL and language.
 * `resources` holds the preloaded i18next translation bundles.
 */
export function render(
  url: string,
  lang: string,
  resources: Resource,
): PrerenderResult {
  const i18n = createServerI18n(lang, resources);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const helmetContext: { helmet?: HelmetServerState } = {};

  const appHtml = renderToString(
    <HelmetProvider context={helmetContext}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={SSR_AUTH}>
          <I18nextProvider i18n={i18n}>
            <StaticRouter location={url}>
              <RoutedApp />
            </StaticRouter>
          </I18nextProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    </HelmetProvider>,
  );

  const helmet = helmetContext.helmet;
  const head = helmet
    ? [
        helmet.title.toString(),
        helmet.meta.toString(),
        helmet.link.toString(),
        helmet.script.toString(),
      ]
        .filter(Boolean)
        .join('\n')
    : '';
  const htmlAttributes = helmet ? helmet.htmlAttributes.toString() : '';

  return { appHtml, head, htmlAttributes };
}
