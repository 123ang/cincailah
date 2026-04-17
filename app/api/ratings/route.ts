import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserId } from '@/lib/session';
import { ensureRestaurantAccessible } from '@/lib/group-access';
import { reportError } from '@/lib/logger';

// POST /api/ratings — submit or update a thumbs up/down for a restaurant
export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { restaurantId, decisionId, thumbs } = body;

    if (!restaurantId || !thumbs) {
      return NextResponse.json({ error: 'restaurantId and thumbs are required' }, { status: 400 });
    }

    if (thumbs !== 'up' && thumbs !== 'down') {
      return NextResponse.json({ error: 'thumbs must be "up" or "down"' }, { status: 400 });
    }

    const restaurant = await ensureRestaurantAccessible(restaurantId, userId);
    if (restaurant === null) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    if (restaurant === false) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rating = await prisma.rating.upsert({
      where: {
        userId_restaurantId_decisionId: {
          userId,
          restaurantId,
          decisionId: decisionId ?? null,
        },
      },
      update: { thumbs },
      create: {
        userId,
        restaurantId,
        decisionId: decisionId ?? null,
        thumbs,
      },
    });

    return NextResponse.json({ success: true, rating });
  } catch (error) {
    reportError(error, { route: 'ratings/post' });
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
  }
}

// GET /api/ratings?restaurantId=... — get current user's rating for a restaurant
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    const where = restaurantId
      ? { userId, restaurantId }
      : { userId };

    const ratings = await prisma.rating.findMany({
      where,
      include: {
        restaurant: {
          select: { id: true, groupId: true },
        },
      },
    });

    const accessible = await Promise.all(
      ratings.map(async (rating) => {
        const restaurant = await ensureRestaurantAccessible(rating.restaurantId, userId);
        return restaurant ? rating : null;
      })
    );

    return NextResponse.json({ ratings: accessible.filter(Boolean) });
  } catch (error) {
    reportError(error, { route: 'ratings/get' });
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
  }
}
