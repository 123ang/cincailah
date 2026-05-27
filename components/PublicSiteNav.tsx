'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DarkModeToggle from '@/components/DarkModeToggle';

const navLinks = [
  { href: '/solo', label: 'Solo', className: 'inline-flex' },
  { href: '/about', label: 'About', className: 'hidden md:inline-flex' },
  { href: '/login', label: 'Log in', className: 'inline-flex' },
];

function navLinkClass(isActive: boolean, extra = '') {
  return [
    'rounded-full px-3 py-2 text-sm font-black transition sm:px-4',
    isActive
      ? 'bg-white text-sambal shadow-sm shadow-sambal/10 dark:bg-white/10 dark:text-orange-200'
      : 'text-slate hover:bg-white/80 hover:text-sambal dark:text-gray-100 dark:hover:bg-white/10 dark:hover:text-orange-200',
    extra,
  ].join(' ');
}

export default function PublicSiteNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="sticky top-0 z-50 border-b border-white/70 bg-cream/90 backdrop-blur-xl transition-colors dark:border-gray-800 dark:bg-gray-950/90"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Cincailah home">
          <Image
            src="/brand/cincailah-logo.jpeg"
            alt=""
            width={44}
            height={44}
            className="brand-logo h-11 w-11 shrink-0 rounded-2xl"
            priority
          />
          <div className="hidden min-w-0 min-[430px]:block">
            <p className="truncate text-lg font-black leading-none tracking-tight text-slate dark:text-white">
              cincailah
            </p>
            <p className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-sambal dark:text-orange-300 min-[380px]:block">
              makan roulette
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <DarkModeToggle />
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={navLinkClass(pathname === item.href, item.className)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/register"
            className={[
              'btn-cincai rounded-full px-3.5 py-2 text-sm font-black text-white sm:px-5',
              pathname === '/register' ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-cream dark:ring-offset-gray-950' : '',
            ].join(' ')}
          >
            Start
          </Link>
        </div>
      </div>
    </nav>
  );
}
