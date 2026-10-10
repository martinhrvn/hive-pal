import { useEffect, type ReactNode } from 'react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  isRouteErrorResponse,
  useLocation,
  useRouteError,
  type MetaDescriptor,
} from 'react-router';
import { ErrorBoundary as SentryErrorBoundary } from '@sentry/react';
import { Toaster } from 'sonner';
import { Providers } from '@/context/providers';
import { PWAUpdatePrompt } from '@/components/pwa-update-prompt';
import GenericErrorPage from '@/pages/error-page';
import { setFaroView } from '@/lib/faro';
import { useRestorePreferredLanguage } from '@/lib/i18n-client';
import { DEFAULT_LANGUAGE, isSupportedLanguage } from '@/utils/language-utils';
import './index.css';
import './App.css';

const SITE_TITLE = 'Hive Pal - Modern Beekeeping Management Software';
const SITE_DESCRIPTION =
  'Manage your beehives efficiently with Hive Pal. Track inspections, monitor hive health, manage harvests, and optimize your beekeeping operations with our comprehensive digital platform.';

// Applies the saved theme before first paint to avoid a light/dark flash
// (mirrors ThemeProvider: storageKey 'vite-ui-theme', default light).
const THEME_SCRIPT = `(function () {
  try {
    var t = localStorage.getItem('vite-ui-theme') || 'light';
    if (t === 'system') {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.add(t);
  } catch (e) {
    document.documentElement.classList.add('light');
  }
})();`;

/**
 * Site-wide default head tags. Pages that manage their own head (the public,
 * multilingual pages via PublicMeta, and the auth/shared pages) export
 * `meta = () => []` from their route module so these defaults do not duplicate
 * theirs; React Router only renders the leaf-most route's `meta`.
 */
export function meta(): MetaDescriptor[] {
  return [
    { title: SITE_TITLE },
    { name: 'title', content: SITE_TITLE },
    { name: 'description', content: SITE_DESCRIPTION },
    {
      name: 'keywords',
      content:
        'beekeeping, hive management, apiary software, bee colony tracking, hive inspection, honey harvest, beekeeping app, apiary management',
    },
    { name: 'author', content: 'Hive Pal' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://hivepal.app/' },
    { property: 'og:title', content: SITE_TITLE },
    {
      property: 'og:description',
      content:
        'Manage your beehives efficiently with Hive Pal. Track inspections, monitor hive health, manage harvests, and optimize your beekeeping operations.',
    },
    { property: 'og:image', content: 'https://hivepal.app/og-image.jpg' },
    { property: 'twitter:card', content: 'summary_large_image' },
    { property: 'twitter:url', content: 'https://hivepal.app/' },
    { property: 'twitter:title', content: SITE_TITLE },
    {
      property: 'twitter:description',
      content:
        'Manage your beehives efficiently with Hive Pal. Track inspections, monitor hive health, and optimize your beekeeping operations.',
    },
    { property: 'twitter:image', content: 'https://hivepal.app/og-image.jpg' },
    { tagName: 'link', rel: 'canonical', href: 'https://hivepal.app/' },
  ];
}

function languageFromPathname(pathname: string): string {
  const first = pathname.split('/')[1];
  return first && isSupportedLanguage(first) ? first : DEFAULT_LANGUAGE;
}

/**
 * The HTML document. Rendered on the server for the prerendered public pages
 * and the SPA shell, then hydrated on the client, so everything in here must be
 * deterministic for a given URL.
 */
export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <html lang={languageFromPathname(pathname)}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <Meta />
        <Links />

        {/* PWA */}
        <meta name="theme-color" content="#f59e0b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Hive Pal" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Hive Pal" />
        <meta name="msapplication-TileColor" content="#f59e0b" />

        {/* Display typeface for editorial UI */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,300..800&family=Manrope:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Favicon */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Analytics */}
        <script
          defer
          src="https://umami.hrvn.eu/script.js"
          data-website-id="a92de4e9-deb5-477f-959a-7b457fe37293"
          data-domains="hivepal.app"
        />
      </head>
      <body>
        {children}
        {/* Runtime config from the backend (window.ENV); must run before the app modules. */}
        <script src="/env.js" />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { pathname } = useLocation();

  // Tag Faro Web Vitals with the current coarse page on every navigation. Safe
  // to run unconditionally: setFaroView is a no-op until Faro is initialized.
  useEffect(() => {
    setFaroView(pathname);
  }, [pathname]);

  useRestorePreferredLanguage();

  return (
    <SentryErrorBoundary>
      <Providers>
        <Outlet />
        <Toaster />
        <PWAUpdatePrompt />
      </Providers>
    </SentryErrorBoundary>
  );
}

/**
 * Rendered into the SPA shell (`index.html`) in place of the route tree. The
 * app renders as soon as the client takes over, so there is nothing to show.
 */
export function HydrateFallback() {
  return null;
}

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return (
      <GenericErrorPage
        code={error.status}
        title={error.status === 404 ? 'Page not found' : undefined}
        message={
          error.status === 404
            ? "We couldn't find the page you were looking for."
            : undefined
        }
        onHome={() => window.location.assign('/')}
      />
    );
  }
  return <GenericErrorPage onHome={() => window.location.assign('/')} />;
}
