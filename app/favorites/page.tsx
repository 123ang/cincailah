import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import FavoritesPageClient from '@/components/FavoritesPageClient';

export const metadata: Metadata = {
  title: 'My Favourites — Cincailah',
  description: 'All the restaurants you have hearted across your groups.',
};

export default async function FavoritesPage() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    redirect('/login');
  }

  const favorites = await prisma.userFavorite.findMany({
    where: { userId: session.userId },
    include: {
      restaurant: {
        include: {
          group: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return <FavoritesPageClient favorites={favorites} />;
}
