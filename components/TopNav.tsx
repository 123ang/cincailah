'use client';

import Link from 'next/link';

export default function TopNav({ groupName, makanCode }: { groupName: string; makanCode: string }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200/50">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/groups" className="flex items-center gap-2 hover:opacity-70 transition">
          <span className="text-sm text-gray-500">←</span>
          <span className="text-2xl">🍛</span>
          <span className="font-extrabold text-lg tracking-tight text-sambal">cincailah</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-700">{groupName}</p>
            <p className="text-[10px] text-gray-400 font-mono">{makanCode}</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
