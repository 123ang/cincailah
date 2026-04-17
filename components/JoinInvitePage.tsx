'use client';

import Link from 'next/link';

interface JoinInvitePageProps {
  makanCode: string;
  groupName: string;
  memberCount: number;
}

export default function JoinInvitePage({
  makanCode,
  groupName,
  memberCount,
}: JoinInvitePageProps) {
  const params = `code=${encodeURIComponent(makanCode)}`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-cream via-mamak/10 to-cream">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-6xl block mb-4">🤝</span>
          <p className="text-sm text-gray-500 uppercase tracking-wider font-bold">
            You&apos;re invited to join
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-slate mt-2">
            {groupName}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {memberCount} {memberCount === 1 ? 'member' : 'members'} ·{' '}
            <span className="font-mono font-bold text-slate">{makanCode}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
          <p className="text-sm text-gray-600 text-center mb-2">
            Sign up free in 30 seconds to join and start deciding.
          </p>

          <Link
            href={`/register?${params}`}
            className="block w-full btn-cincai text-white font-bold py-3.5 rounded-xl text-center text-sm"
          >
            Create free account
          </Link>

          <Link
            href={`/login?${params}`}
            className="block w-full bg-white border-2 border-gray-200 text-slate font-bold py-3.5 rounded-xl text-center text-sm hover:bg-gray-50"
          >
            I already have an account
          </Link>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/solo"
            className="text-sm text-gray-500 hover:text-sambal font-semibold"
          >
            Not now — try solo mode instead →
          </Link>
        </div>
      </div>
    </div>
  );
}
