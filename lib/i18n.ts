export const SUPPORTED_LOCALES = ['en', 'ms', 'zh'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'EN',
  ms: 'BM',
  zh: '中文',
};

export const messages: Record<Locale, Record<string, string>> = {
  en: {
    backToGroups: 'Back to groups',
    language: 'Language',
  },
  ms: {
    backToGroups: 'Kembali ke kumpulan',
    language: 'Bahasa',
  },
  zh: {
    backToGroups: '返回群组',
    language: '语言',
  },
};

export function getMessage(locale: Locale, key: string) {
  return messages[locale]?.[key] ?? messages.en[key] ?? key;
}

