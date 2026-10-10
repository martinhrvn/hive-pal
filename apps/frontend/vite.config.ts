import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';

/**
 * The server render (prerendering public pages, the SPA shell) cannot use the
 * real better-auth client: `useSession` has no server snapshot and the passkey
 * plugin pulls in browser-only WebAuthn code. Swap in a stub for server-side
 * resolution only, in dev and build alike.
 */
function serverAuthClientStub(): Plugin {
  const stub = path.resolve(__dirname, './src/lib/auth-client.ssr.ts');
  return {
    name: 'hive-pal:server-auth-client-stub',
    enforce: 'pre',
    resolveId(id, _importer, options) {
      return options.ssr && id === '@/lib/auth-client' ? stub : null;
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [serverAuthClientStub(), reactRouter(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/env.js': 'http://localhost:3000',
    },
  },
  // Bundle dependencies into the server build (used only at build time to
  // prerender) so CommonJS-only packages get proper ESM interop when React
  // Router imports the server bundle with native Node ESM.
  ssr: isSsrBuild ? { noExternal: true } : undefined,
  build: {
    rollupOptions: {
      output: isSsrBuild
        ? {}
        : {
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'react-router'],
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
