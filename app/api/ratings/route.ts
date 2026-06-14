import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserId } from '@/lib/session';
import { ensureRestaurantAccessible, getDecisionWithMembership } from '@/lib/group-access';
import { reportError } from '@/lib/logger';
import { RatingSchema, zodError } from '@/lib/schemas';

// POST /api/ratings — submit or update a thumbs up/down for a restaurant
export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = RatingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }
    const { restaurantId, decisionId, thumbs } = parsed.data;

    const restaurant = await ensureRestaurantAccessible(restaurantId, userId);
    if (restaurant === null) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    if (restaurant === false) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (decisionId) {
      const decision = await getDecisionWithMembership(decisionId, userId);
      if (decision === null) {
        return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
      }
      if (decision === false || decision.groupId !== restaurant.groupId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (decision.chosenRestaurantId && decision.chosenRestaurantId !== restaurantId) {
        return NextResponse.json(
          { error: 'Rating restaurant does not match the decision winner' },
          { status: 400 }
        );
      }
    }

    const rating = decisionId
      ? await prisma.rating.upsert({
          where: {
            userId_restaurantId_decisionId: {
              userId,
              restaurantId,
              decisionId,
            },
          },
          update: { thumbs },
          create: {
            userId,
            restaurantId,
            decisionId,
            thumbs,
          },
        })
      : await upsertStandaloneRating({ userId, restaurantId, thumbs });

    return NextResponse.json({ success: true, rating });
  } catch (error) {
    reportError(error, { route: 'ratings/post' });
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
  }
}

async function upsertStandaloneRating({
  userId,
  restaurantId,
  thumbs,
}: {
  userId: string;
  restaurantId: string;
  thumbs: 'up' | 'down';
}) {
  const existing = await prisma.rating.findFirst({
    where: { userId, restaurantId, decisionId: null },
    select: { id: true },
  });

  if (existing) {
    return prisma.rating.update({
      where: { id: existing.id },
      data: { thumbs },
    });
  }

  return prisma.rating.create({
    data: {
      userId,
      restaurantId,
      decisionId: null,
      thumbs,
    },
  });
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

    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const accessibleGroupIds = memberships.map((membership) => membership.groupId);

    if (accessibleGroupIds.length === 0) {
      return NextResponse.json({ ratings: [] });
    }

    const ratings = await prisma.rating.findMany({
      where: {
        userId,
        ...(restaurantId ? { restaurantId } : {}),
        restaurant: {
          groupId: { in: accessibleGroupIds },
        },
      },
      include: {
        restaurant: {
          select: { id: true, groupId: true },
        },
      },
    });

    return NextResponse.json({ ratings });
  } catch (error) {
    reportError(error, { route: 'ratings/get' });
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
  }
}
