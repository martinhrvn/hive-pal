import { createHash, randomBytes } from 'node:crypto';

const API_KEY_PREFIX = 'hpk_';
const RAW_BYTES = 32;

export function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function generateApiKey(): {
  raw: string;
  hash: string;
  prefix: string;
} {
  const raw = `${API_KEY_PREFIX}${randomBytes(RAW_BYTES).toString('base64url')}`;
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, 12),
  };
}
