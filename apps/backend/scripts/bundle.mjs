/**
 * Bundle the compiled NestJS entrypoint into a single CommonJS file.
 *
 * Run after `nest build`:
 *   pnpm --filter backend exec node scripts/bundle.mjs
 *
 * Packages that need files from their own directory at runtime (native
 * binaries, wasm, fonts, Swagger UI assets) stay external and are installed
 * in the runtime image. Keep the external list in sync with
 * docker/runtime/package.json.
 */
import { build } from 'esbuild';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const external = [
  // Native modules.
  'bcrypt',
  'sharp',
  // Prisma runtime ships wasm query compilers loaded with dynamic imports.
  '@prisma/client',
  '@prisma/client/*',
  // Loads .afm font files from its package at runtime.
  'pdfkit',
  // Loads wasm from its package at runtime.
  'satori',
  // Static assets served by SwaggerModule.
  'swagger-ui-dist',
  // Nest packages must all come from the same node_modules copy; mixing a
  // bundled @nestjs/core with an external Nest module breaks dependency
  // injection. Some also use require.resolve()/asset paths.
  '@nestjs/*',
  // Sentry installs diagnostics-channel hooks from its own package path.
  '@sentry/*',
  // Requires express from its own bundled adapter and uses loadPackage().
  '@thallesp/nestjs-better-auth',
  'class-validator',
  'ioredis',
  'mqtt',
  'nats',
  'kafkajs',
  'amqplib',
  'pg-native',
  'snappy',
  '@napi-rs/snappy-*',
  '@fastify/static',
  '@nestjs/graphql',
];

await build({
  absWorkingDir: backendRoot,
  entryPoints: [
    { in: 'dist/src/main.js', out: 'main' },
    { in: 'dist/scripts/seed-admin.js', out: 'seed-admin' },
    { in: 'dist/scripts/seed-demo.js', out: 'seed-demo' },
  ],
  outdir: 'dist/bundle',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  external,
  // Some ESM-authored dependencies call createRequire(import.meta.url). The
  // bundle is CommonJS, where import.meta.url does not exist.
  define: { 'import.meta.url': '__import_meta_url' },
  banner: {
    js: 'const __import_meta_url = require("node:url").pathToFileURL(__filename).href;',
  },
  logLevel: 'info',
  sourcemap: false,
});

console.log('Bundled dist/bundle/');
