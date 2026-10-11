import { describe, expect, it } from 'vitest';
import { parseByteLimit } from './byte-limit';

describe('parseByteLimit', () => {
  const fallback = 52428800;

  it('returns the fallback when the value is missing', () => {
    expect(parseByteLimit(undefined, fallback)).toBe(fallback);
    expect(parseByteLimit(null, fallback)).toBe(fallback);
  });

  it('parses numeric strings as env vars provide them', () => {
    expect(parseByteLimit('10485760', fallback)).toBe(10485760);
    expect(parseByteLimit(' 10485760 ', fallback)).toBe(10485760);
    expect(parseByteLimit('0', fallback)).toBe(0);
  });

  it('passes valid numbers through', () => {
    expect(parseByteLimit(1024, fallback)).toBe(1024);
    expect(parseByteLimit(Infinity, fallback)).toBe(Infinity);
  });

  it('falls back on empty or invalid values', () => {
    expect(parseByteLimit('', fallback)).toBe(fallback);
    expect(parseByteLimit('50MB', fallback)).toBe(fallback);
    expect(parseByteLimit('-1', fallback)).toBe(fallback);
    expect(parseByteLimit('1.5', fallback)).toBe(fallback);
    expect(parseByteLimit(NaN, fallback)).toBe(fallback);
    expect(parseByteLimit({}, fallback)).toBe(fallback);
  });
});
