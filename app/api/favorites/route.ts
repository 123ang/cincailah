import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { ensureRestaurantAccessible } from '@/lib/group-access';

// GET /api/favorites — fetch user's favorite restaurant IDs
export async function GET() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await prisma.userFavorite.findMany({
      where: { userId: session.userId },
      select: { restaurantId: true },
    });

    const restaurantIds = favorites.map((f) => f.restaurantId);

    return NextResponse.json({ restaurantIds });
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

// POST /api/favorites — toggle favorite (add or remove)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
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

    const restaurant = await ensureRestaurantAccessible(restaurantId, session.userId);

    if (restaurant === null) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    if (restaurant === false) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if already favorited
    const existing = await prisma.userFavorite.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.userId,
          restaurantId,
        },
      },
    });

    if (existing) {
      // Remove favorite
      await prisma.userFavorite.delete({
        where: { id: existing.id },
      });

      return NextResponse.json({ favorited: false });
    } else {
      // Add favorite
      await prisma.userFavorite.create({
        data: {
          userId: session.userId,
          restaurantId,
        },
      });

      return NextResponse.json({ favorited: true });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}
