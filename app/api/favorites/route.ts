import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserId } from '@/lib/session';
import { ensureRestaurantAccessible } from '@/lib/group-access';
import { reportError } from '@/lib/logger';

// GET /api/favorites — fetch user's favorite restaurant IDs
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await prisma.userFavorite.findMany({
      where: { userId },
      select: { restaurantId: true },
    });

    const restaurantIds = favorites.map((f) => f.restaurantId);

    return NextResponse.json({ restaurantIds, favorites: restaurantIds });
  } catch (error) {
    reportError(error, { route: 'favorites/get' });
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

// POST /api/favorites — toggle favorite (add or remove)
export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { restaurantId } = body;

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID required' },
        { status: 400 }
      );
    }

    const restaurant = await ensureRestaurantAccessible(restaurantId, userId);

    if (restaurant === null) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    if (restaurant === false) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.userFavorite.findUnique({
      where: {
        userId_restaurantId: {
          userId,
          restaurantId,
        },
      },
    });

    if (existing) {
      await prisma.userFavorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }

    await prisma.userFavorite.create({
      data: { userId, restaurantId },
    });
    return NextResponse.json({ favorited: true });
  } catch (error) {
    reportError(error, { route: 'favorites/toggle' });
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}
