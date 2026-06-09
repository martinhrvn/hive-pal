import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // The PWA/service-worker plugin only applies to the client build.
    ...(isSsrBuild
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: [
              'favicon.ico',
              'favicon-16x16.png',
              'favicon-32x32.png',
              'apple-touch-icon.png',
              'android-chrome-192x192.png',
              'android-chrome-512x512.png',
            ],
            manifest: false, // use existing site.webmanifest
            workbox: {
              clientsClaim: true,
              skipWaiting: true,
              globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
              // The service worker falls back to index.html for navigation requests.
              // Backend-handled routes (API + better-auth, e.g. the magic-link verify
              // link opened directly in the browser) must NOT be served the SPA shell,
              // otherwise they never reach the server. The static SEO files
              // (sitemap.xml, robots.txt, llms.txt) are real files served by the
              // backend; without these entries the SW answers a direct browser
              // navigation to them with the cached index.html instead.
              navigateFallbackDenylist: [
                /^\/api\//,
                /^\/env\.js$/,
                /^\/sitemap\.xml$/,
                /^\/robots\.txt$/,
                /^\/llms\.txt$/,
              ],
              runtimeCaching: [
                {
                  // Cache locale/translation files
                  urlPattern: /\/locales\/.*\.json$/,
                  handler: 'StaleWhileRevalidate',
                  options: {
                    cacheName: 'locales-cache',
                    expiration: {
                      maxEntries: 50,
                      maxAgeSeconds: 60 * 60 * 24 * 7,
                    },
                  },
                },
              ],
            },
          }),
        ]),
  ],
  resolve: {
    alias: {
      // The SSR/prerender build cannot use the real better-auth client
      // (no server snapshot, browser-only passkey code); swap in a stub.
      // Must precede the '@' alias so the more specific match wins.
      ...(isSsrBuild
        ? {
            '@/lib/auth-client': path.resolve(
              __dirname,
              './src/lib/auth-client.ssr.ts',
            ),
          }
        : {}),
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/env.js': 'http://localhost:3000',
    },
  },
  // Bundle dependencies into the SSR build so CommonJS-only packages (e.g.
  // react-helmet-async) get proper ESM interop when the prerender script
  // imports dist-ssr/entry-server.js with native Node ESM.
  ssr: {
    noExternal: true,
  },
  build: {
    rollupOptions: {
      output: isSsrBuild
        ? {}
        : {
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'react-router-dom'],
              'vendor-ui': [
                '@radix-ui/react-dialog',
                '@radix-ui/react-dropdown-menu',
                '@radix-ui/react-select',
                '@radix-ui/react-tabs',
                '@radix-ui/react-tooltip',
              ],
              'vendor-charts': ['recharts'],
              'vendor-maps': ['leaflet', 'react-leaflet'],
              'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
              'vendor-query': ['@tanstack/react-query'],
            },
          },
    },
  },
}));
