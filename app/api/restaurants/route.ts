import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { requireGroupMembership } from '@/lib/group-access';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID required' }, { status: 400 });
    }

    const membership = await requireGroupMembership(session.userId, groupId);
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const restaurants = await prisma.restaurant.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error('Get restaurants error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
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
    } = body;

    if (!groupId || !name) {
      return NextResponse.json(
        { error: 'Group ID and name are required' },
        { status: 400 }
      );
    }

    // Verify user is member of the group
    const membership = await requireGroupMembership(session.userId, groupId);

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        groupId,
        name: name.trim(),
        cuisineTags: cuisineTags || [],
        vibeTags: vibeTags || [],
        priceMin: Number(priceMin) || 5,
        priceMax: Number(priceMax) || 15,
        halal: Boolean(halal),
        vegOptions: Boolean(vegOptions),
        walkMinutes: Number(walkMinutes) || 5,
        mapsUrl: mapsUrl || null,
        photoUrl: photoUrl || null,
        latitude: typeof latitude === 'number' ? latitude : null,
        longitude: typeof longitude === 'number' ? longitude : null,
        createdBy: session.userId,
      },
    });

    return NextResponse.json({ success: true, restaurant });
  } catch (error) {
    console.error('Create restaurant error:', error);
    return NextResponse.json(
      { error: 'Failed to create restaurant' },
      { status: 500 }
    );
  }
}
