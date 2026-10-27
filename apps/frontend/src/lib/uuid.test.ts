import { afterEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from './uuid';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('randomUUID', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a v4 UUID without crypto.randomUUID (insecure context)', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: crypto.getRandomValues.bind(crypto),
    });
    const id = randomUUID();
    expect(id).toMatch(UUID_V4);
    expect(randomUUID()).not.toBe(id);
  });
});
