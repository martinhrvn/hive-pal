/**
 * Generate pnpm-lock.prod.yaml: the lockfile for the backend-only runtime
 * image. It is produced from a pruned backend workspace with devDependencies
 * removed, so pnpm does not pull optional peers that only exist for tests and
 * build tooling (Vitest, Vite, webpack, ...).
 *
 * The committed lockfile is installed in Docker with --frozen-lockfile. Run
 * this script after changing backend dependencies:
 *
 *   pnpm prod-lock
 */
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pnpmCli = process.env.npm_execpath;

if (!pnpmCli) {
  throw new Error('Run this script through pnpm: `pnpm prod-lock`');
}

// Invoke pnpm through the Node binary so the executable path does not come
// from PATH.
const runPnpm = (args, cwd) =>
  execFileSync(process.execPath, [pnpmCli, ...args], {
    cwd,
    stdio: 'inherit',
  });

const tmp = mkdtempSync(join(tmpdir(), 'hivepal-prod-lock-'));
const pruned = join(tmp, 'out');
const workspace = join(tmp, 'workspace');

try {
  runPnpm(
    ['exec', 'turbo', 'prune', 'backend', '--docker', '--out-dir', pruned],
    repoRoot,
  );

  cpSync(join(pruned, 'json'), workspace, { recursive: true });
  cpSync(join(repoRoot, 'pnpm-lock.yaml'), join(workspace, 'pnpm-lock.yaml'));
  writeFileSync(join(workspace, '.npmrc'), 'auto-install-peers=false\n');

  execFileSync(
    process.execPath,
    [join(repoRoot, 'scripts', 'strip-dev-dependencies.mjs'), workspace],
    { cwd: repoRoot, stdio: 'inherit' },
  );
  runPnpm(['install', '--lockfile-only'], workspace);

  const generated = join(workspace, 'pnpm-lock.yaml');
  if (!existsSync(generated)) {
    throw new Error('pnpm did not generate a lockfile');
  }
  writeFileSync(join(repoRoot, 'pnpm-lock.prod.yaml'), readFileSync(generated));
  console.log('\nWrote pnpm-lock.prod.yaml');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
