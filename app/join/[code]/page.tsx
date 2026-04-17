import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import JoinInvitePage from '@/components/JoinInvitePage';

export const metadata: Metadata = {
  title: 'Join Makan Group — Cincailah',
};

function NotFound({ code }: { code: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cream">
      <div className="w-full max-w-md text-center">
        <span className="text-6xl block mb-4">🤷</span>
        <h1 className="text-2xl font-black text-slate mb-2">
          Hmm, that code doesn&apos;t exist
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          <span className="font-mono font-bold">{code}</span> isn&apos;t a valid
          Makan Code. Double-check with your friend.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="btn-cincai text-white font-bold py-3 rounded-xl"
          >
            Back home
          </Link>
          <Link
            href="/solo"
            className="bg-white border-2 border-gray-200 text-slate font-bold py-3 rounded-xl hover:bg-gray-50"
          >
            Try solo mode instead
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function JoinByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = (rawCode || '').trim().toUpperCase();

  if (!code || code.length < 4 || code.length > 12) {
    return <NotFound code={rawCode} />;
  }

  const group = await prisma.group.findUnique({
    where: { makanCode: code },
    include: {
      _count: { select: { members: true } },
    },
  });

  if (!group) {
    return <NotFound code={code} />;
  }

  const session = await getSession();

  if (session?.isLoggedIn && session.userId) {
    const existing = await prisma.groupMember.findFirst({
      where: { userId: session.userId, groupId: group.id },
    });

    if (!existing) {
      await prisma.groupMember.create({
        data: {
          userId: session.userId,
          groupId: group.id,
          role: 'member',
        },
      });
    }

    session.activeGroupId = group.id;
    await session.save();

    redirect(`/group/${group.id}`);
  }

  return (
    <JoinInvitePage
      makanCode={code}
      groupName={group.name}
      memberCount={group._count.members}
    />
  );
}
