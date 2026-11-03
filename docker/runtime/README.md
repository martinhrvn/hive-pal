# Runtime dependencies

The backend is shipped as an esbuild bundle. Only the packages the bundle
leaves external (native modules, wasm/font/asset packages, Nest, Sentry,
better-auth) plus the Prisma CLI are installed in the runtime image.

`package.json` mirrors the `external` list in
`apps/backend/scripts/bundle.mjs`. Keep them in sync when adding a package
that cannot be bundled.

Regenerate the lockfile after changing `package.json`:

```bash
cd docker/runtime
pnpm install --lockfile-only --ignore-workspace
```

`--ignore-workspace` is required because this directory intentionally has its
own lockfile and is not a package of the root pnpm workspace.
