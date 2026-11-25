import { describe, expect, it } from 'vitest';
import { generatePassword } from './generate-password';

describe('generatePassword', () => {
  it('returns the requested length', () => {
    expect(generatePassword()).toHaveLength(16);
    expect(generatePassword(24)).toHaveLength(24);
  });

  it('avoids look-alike characters', () => {
    const sample = Array.from({ length: 50 }, () => generatePassword()).join(
      '',
    );
    expect(sample).not.toMatch(/[0O1lI]/);
  });

  it('does not repeat itself', () => {
    expect(generatePassword()).not.toBe(generatePassword());
  });
});
