import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import ProfileSettingsClient from '@/components/ProfileSettingsClient';

export const metadata: Metadata = {
  title: 'Profile & Preferences',
  description: 'Manage your dietary preferences and account settings.',
};

export default async function ProfileSettingsPage() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    redirect('/login');
  }

  const [user, prefs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, displayName: true, emailVerified: true, avatarUrl: true },
    }),
    prisma.userPreferences.findUnique({
      where: { userId: session.userId },
    }),
  ]);

  if (!user) redirect('/login');

  return (
    <ProfileSettingsClient
      user={user}
      preferences={prefs ?? { halal: false, vegOptions: false, defaultBudget: 20 }}
    />
  );
}
