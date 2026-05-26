'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Locale, SUPPORTED_LOCALES, getMessage } from '@/lib/i18n';

export default function TopNav({ groupName, makanCode }: { groupName: string; makanCode: string }) {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const stored = localStorage.getItem('locale');
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      setLocale(stored as Locale);
    }
    const onLocaleChanged = (event: Event) => {
      const detail = (event as CustomEvent<Locale>).detail;
      if (detail && SUPPORTED_LOCALES.includes(detail)) {
        setLocale(detail);
      }
    };
    window.addEventListener('locale-changed', onLocaleChanged);
    return () => window.removeEventListener('locale-changed', onLocaleChanged);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/70 dark:bg-gray-900/90 dark:border-gray-700/50">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/groups"
          className="flex items-center gap-2 hover:opacity-80 transition"
          aria-label={getMessage(locale, 'backToGroups')}
        >
          <span className="text-sm font-black text-sambal dark:text-orange-300">←</span>
          <Image
            src="/brand/cincailah-logo.jpeg"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-2xl object-cover shadow-md shadow-sambal/20"
          />
          <span className="font-extrabold text-lg tracking-tight text-slate dark:text-white">cincailah</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{groupName}</p>
            <p className="text-[10px] text-sambal/70 dark:text-orange-300 font-mono">{makanCode}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}
