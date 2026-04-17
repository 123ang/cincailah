import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import TopNav from '@/components/TopNav';
import BottomNav from '@/components/BottomNav';

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  try {
    const session = await getSession();
    const { groupId } = await params;

    if (!session?.isLoggedIn || !session?.userId) {
      redirect('/login?redirect=' + encodeURIComponent('/group/' + groupId));
    }

    // Verify user has access to this group
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: session.userId,
      },
      include: {
        group: true,
      },
    });

    if (!membership) {
      redirect('/login?redirect=' + encodeURIComponent('/group/' + groupId) + '&reason=not_member');
    }

    return (
      <div className="min-h-screen">
        <TopNav groupName={membership.group.name} makanCode={membership.group.makanCode} />
        <div className="pt-14 pb-16">
          {children}
        </div>
        <BottomNav groupId={groupId} />
      </div>
    );
  } catch (err) {
    console.error('Group layout error:', err);
    redirect('/login?error=session');
  }
}
