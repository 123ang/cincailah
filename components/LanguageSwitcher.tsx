'use client';

import { LOCALE_LABEL, Locale, SUPPORTED_LOCALES } from '@/lib/i18n';
import { useLocale, useT } from '@/components/LocaleProvider';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const t = useT();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className="h-8 rounded-lg border border-gray-200 bg-white px-1.5 text-xs font-bold text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      aria-label={t('Language')}
      title={t('Language')}
    >
      {SUPPORTED_LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABEL[l]}
        </option>
      ))}
    </select>
  );
}
