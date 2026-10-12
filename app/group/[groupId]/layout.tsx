import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import TopNav from '@/components/TopNav';
import BottomNav from '@/components/BottomNav';
import LocaleProvider from '@/components/LocaleProvider';
import { LOCALE_COOKIE, isLocale } from '@/lib/i18n';

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

    const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;

    return (
      <LocaleProvider initialLocale={isLocale(cookieLocale) ? cookieLocale : 'en'}>
        <div className="min-h-screen bg-white dark:bg-gray-950">
          <TopNav groupName={membership.group.name} makanCode={membership.group.makanCode} />
          {/* Bottom padding clears the fixed bottom bar (h-16) plus the safe area. */}
          <div className="pt-14 pb-[calc(5rem+env(safe-area-inset-bottom))]">
            {children}
          </div>
          <BottomNav groupId={groupId} />
        </div>
      </LocaleProvider>
    );
  } catch (err) {
    console.error('Group layout error:', err);
    redirect('/login?error=session');
  }
}
