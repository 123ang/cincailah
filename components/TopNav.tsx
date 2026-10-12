'use client';

import Link from 'next/link';
import Image from 'next/image';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SoundToggle from '@/components/SoundToggle';
import { useT } from '@/components/LocaleProvider';

export default function TopNav({ groupName, makanCode }: { groupName: string; makanCode: string }) {
  const t = useT();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/70 dark:bg-gray-900/90 dark:border-gray-700/50">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between gap-2">
        <Link
          href="/groups"
          className="flex shrink-0 items-center gap-2 hover:opacity-80 transition"
          aria-label={t('Back to groups')}
        >
          <span className="text-sm font-black text-sambal dark:text-orange-300">←</span>
          <Image
            src="/brand/cincailah-logo.jpeg"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-2xl object-cover shadow-md shadow-sambal/20"
          />
          <span className="hidden font-extrabold text-lg tracking-tight text-slate dark:text-white min-[420px]:inline">
            cincailah
          </span>
        </Link>
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="min-w-0 text-right">
            <p className="truncate text-xs font-semibold text-gray-700 dark:text-gray-200">{groupName}</p>
            <p className="text-[10px] text-sambal/70 dark:text-orange-300 font-mono">{makanCode}</p>
          </div>
          <SoundToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}
