import { ms } from './locales/ms';
import { zh } from './locales/zh';

export const SUPPORTED_LOCALES = ['en', 'ms', 'zh'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_STORAGE_KEY = 'locale';
export const LOCALE_COOKIE = 'locale';
export const LOCALE_EVENT = 'locale-changed';

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'EN',
  ms: 'BM',
  zh: '中文',
};

export const HTML_LANG: Record<Locale, string> = {
  en: 'en',
  ms: 'ms',
  zh: 'zh-Hans',
};

export type TranslateVars = Record<string, string | number>;

// Dictionaries are keyed by the English UI text, so English needs no dictionary
// and any missing entry falls back to English.
const dictionaries: Record<Exclude<Locale, 'en'>, Record<string, string>> = { ms, zh };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function translate(locale: Locale, text: string, vars?: TranslateVars): string {
  const template = locale === 'en' ? text : dictionaries[locale][text] ?? text;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}
