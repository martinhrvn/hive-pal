// apps/frontend/src/lib/locale-utils.ts
import { de, enGB, da, it, sk, sr, type Locale } from 'date-fns/locale';

export const localeMap: Record<string, Locale> = {
  de: de,
  'de-informal': de,
  en: enGB,
  da: da,
  it: it,
  sk: sk,
  sr: sr,
};

export const getDateLocale = (language: string): Locale => {
  return localeMap[language] ?? enGB;
};
