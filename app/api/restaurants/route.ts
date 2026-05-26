import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserId } from '@/lib/session';
import { requireGroupMembership } from '@/lib/group-access';
import { reportError } from '@/lib/logger';
import { CreateRestaurantSchema, zodError } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID required' }, { status: 400 });
    }

    const membership = await requireGroupMembership(userId, groupId);
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const restaurants = await prisma.restaurant.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ restaurants });
  } catch (error) {
    reportError(error, { route: 'restaurants/get' });
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = CreateRestaurantSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }

    const {
      groupId,
      name,
      cuisineTags,
      vibeTags,
      priceMin,
      priceMax,
      halal,
      vegOptions,
      walkMinutes,
      mapsUrl,
      photoUrl,
      latitude,
      longitude,
    } = parsed.data;

    const membership = await requireGroupMembership(userId, groupId);

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        groupId,
        name: name.trim(),
        cuisineTags,
        vibeTags,
        priceMin,
        priceMax,
        halal,
        vegOptions,
        walkMinutes,
        mapsUrl: mapsUrl ?? null,
        photoUrl: photoUrl ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        createdBy: userId,
      },
    });

    return NextResponse.json({ success: true, restaurant });
  } catch (error) {
    reportError(error, { route: 'restaurants/create' });
    return NextResponse.json(
      { error: 'Failed to create restaurant' },
      { status: 500 }
    );
  }
}
