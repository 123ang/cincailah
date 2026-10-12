'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  HTML_LANG,
  LOCALE_COOKIE,
  LOCALE_EVENT,
  LOCALE_STORAGE_KEY,
  Locale,
  TranslateVars,
  isLocale,
  translate,
} from '@/lib/i18n';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => undefined,
});

function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    /* storage blocked */
  }
  const cookie = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`))?.[1];
  return isLocale(cookie) ? cookie : null;
}

/**
 * Holds the UI language. `initialLocale` comes from the `locale` cookie when a
 * server component knows it (no flash of English); otherwise the stored choice
 * is applied after mount. Every provider follows the `locale-changed` event, so
 * nested providers stay in sync.
 */
export default function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? 'en');

  useEffect(() => {
    if (!initialLocale) {
      const stored = readStoredLocale();
      if (stored) setLocaleState(stored);
    }
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<unknown>).detail;
      if (isLocale(next)) setLocaleState(next);
    };
    window.addEventListener(LOCALE_EVENT, onChange);
    return () => window.removeEventListener(LOCALE_EVENT, onChange);
  }, [initialLocale]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* storage blocked */
    }
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: next }));
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

/** `t('Tap once to decide')`, `t('{count} members', { count })` */
export function useT() {
  const { locale } = useContext(LocaleContext);
  return useCallback(
    (text: string, vars?: TranslateVars) => translate(locale, text, vars),
    [locale],
  );
}
