import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserId } from '@/lib/session';
import { ensureRestaurantAccessible } from '@/lib/group-access';
import { deleteUpload } from '@/lib/upload';
import { reportError } from '@/lib/logger';
import { UpdateRestaurantSchema, zodError } from '@/lib/schemas';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: restaurantId } = await params;

    const access = await ensureRestaurantAccessible(restaurantId, userId);
    if (!access) {
      return NextResponse.json(
        { error: 'Restaurant not found or you are not a member of this group' },
        { status: 403 }
      );
    }

    const existing = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const parsed = UpdateRestaurantSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }

    const {
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

    const pMin = priceMin !== undefined ? Number(priceMin) : existing.priceMin;
    const pMax = priceMax !== undefined ? Number(priceMax) : existing.priceMax;
    if (pMin >= pMax) {
      return NextResponse.json(
        { error: 'Price max must be greater than price min' },
        { status: 400 }
      );
    }

    const nextPhoto =
      photoUrl !== undefined ? (photoUrl ? photoUrl.trim() : null) : existing.photoUrl;

    if (
      photoUrl !== undefined &&
      existing.photoUrl &&
      existing.photoUrl !== nextPhoto &&
      existing.photoUrl.startsWith('/uploads/')
    ) {
      await deleteUpload(existing.photoUrl);
    }

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(cuisineTags !== undefined && { cuisineTags }),
        ...(vibeTags !== undefined && { vibeTags }),
        ...(priceMin !== undefined && { priceMin: pMin }),
        ...(priceMax !== undefined && { priceMax: pMax }),
        ...(halal !== undefined && { halal }),
        ...(vegOptions !== undefined && { vegOptions }),
        ...(walkMinutes !== undefined && { walkMinutes }),
        ...(mapsUrl !== undefined && { mapsUrl: mapsUrl ? mapsUrl.trim() : null }),
        ...(photoUrl !== undefined && { photoUrl: nextPhoto }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      },
    });

    return NextResponse.json({ success: true, restaurant: updated });
  } catch (error) {
    reportError(error, { route: 'restaurants/[id]/patch' });
    return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 });
  }
}
