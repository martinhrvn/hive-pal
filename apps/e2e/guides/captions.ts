import fs from 'node:fs';
import path from 'node:path';

/**
 * Caption text for a cue: a plain string, or a translation key made with
 * `t()`. Every cue goes through `caption()`, so guides can be localised later
 * through the same pipeline as the app (Weblate) without touching the specs.
 */
export type Caption = string | CaptionKey;
export type CaptionKey = {
  key: string;
  values?: Record<string, string | number>;
};

/** Mark a caption as a translation key, e.g. `g.say(t('harvest.intro'))`. */
export function t(
  key: string,
  values?: Record<string, string | number>,
): CaptionKey {
  return { key, values };
}

/** Locale used for captions and for the browser (GUIDE_LOCALE, default en). */
export const GUIDE_LOCALE = process.env.GUIDE_LOCALE ?? 'en';
const LOCALES_DIR = path.join(__dirname, 'locales');

const catalogs = new Map<string, Record<string, unknown>>();

function catalog(locale: string): Record<string, unknown> {
  let c = catalogs.get(locale);
  if (!c) {
    const file = path.join(LOCALES_DIR, `${locale}.json`);
    c = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
    catalogs.set(locale, c!);
  }
  return c!;
}

function lookup(locale: string, key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object'
          ? (node as Record<string, unknown>)[part]
          : undefined,
      catalog(locale),
    );
  return typeof value === 'string' ? value : undefined;
}

/**
 * Resolve a caption to display text. Keys fall back to the `en` catalog and
 * throw when missing there too, so a typo fails the guide in CI as well.
 * `{{name}}` placeholders are interpolated like i18next does.
 */
export function caption(text: Caption, locale = GUIDE_LOCALE): string {
  if (typeof text === 'string') return text;
  const template = lookup(locale, text.key) ?? lookup('en', text.key);
  if (template === undefined)
    throw new Error(`Missing guide caption "${text.key}" (${locale})`);
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, name: string) =>
    String(text.values?.[name] ?? ''),
  );
}
