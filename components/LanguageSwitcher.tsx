'use client';

import { useEffect, useState } from 'react';
import { Locale, LOCALE_LABEL, SUPPORTED_LOCALES, getMessage } from '@/lib/i18n';

const STORAGE_KEY = 'locale';

export default function LanguageSwitcher() {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      setLocale(stored as Locale);
    }
  }, []);

  const onChangeLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    localStorage.setItem(STORAGE_KEY, nextLocale);
    document.cookie = `locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: nextLocale }));
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-gray-400 dark:text-gray-500">
        {getMessage(locale, 'language')}
      </span>
      <select
        value={locale}
        onChange={(e) => onChangeLocale(e.target.value as Locale)}
        className="text-[10px] border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md px-1.5 py-0.5 text-gray-600 dark:text-gray-300"
        aria-label={getMessage(locale, 'language')}
      >
        {SUPPORTED_LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABEL[l]}
          </option>
        ))}
      </select>
    </div>
  );
}

