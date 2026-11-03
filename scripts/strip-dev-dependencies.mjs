/**
 * Remove devDependencies from the package.json files in a pruned backend
 * workspace. Used when generating the production lockfile and again in the
 * Docker prod-deps stage so pnpm's frozen install sees the same manifests.
 *
 * Usage: node scripts/strip-dev-dependencies.mjs <workspace-dir>
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
if (!root) {
  console.error(
    'Usage: node scripts/strip-dev-dependencies.mjs <workspace-dir>',
  );
  process.exit(1);
}

const manifests = [
  'package.json',
  'apps/backend/package.json',
  'packages/shared-schemas/package.json',
];

for (const manifest of manifests) {
  const path = join(root, manifest);
  if (!existsSync(path)) continue;

  const pkg = JSON.parse(readFileSync(path, 'utf8'));
  if (!pkg.devDependencies) continue;

  delete pkg.devDependencies;
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
}
