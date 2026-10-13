import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Serves the component-test story gallery (playwright/gallery/). The app's own
 * dev server runs React Router in framework mode, which renders every URL
 * through the app's routes, so the gallery needs a plain Vite server of its own.
 * API calls are left unproxied: component tests mock them with page.route().
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 3100,
    strictPort: true,
  },
});
