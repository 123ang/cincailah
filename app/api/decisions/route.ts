import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { verifyMobileToken } from '@/app/api/auth/token/route';

async function resolveUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    const payload = verifyMobileToken(token);
    if (payload?.sub) return payload.sub;
  }

  const session = await getSession();
  if (session?.isLoggedIn && session.userId) return session.userId;

  return null;
}

// GET /api/decisions?groupId=<uuid>&limit=30
// - with groupId: group decision history
// - without groupId: solo decision history (groupId IS NULL)
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId');
    const limit = Math.min(Number(url.searchParams.get('limit') || 30), 100);

    if (groupId) {
      const membership = await prisma.groupMember.findFirst({
        where: { userId, groupId },
        select: { id: true },
      });
      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const decisions = await prisma.lunchDecision.findMany({
      where: groupId ? { groupId } : { groupId: null, createdBy: userId },
      include: {
        chosenRestaurant: {
          select: {
            id: true,
            name: true,
            priceMin: true,
            priceMax: true,
            walkMinutes: true,
            mapsUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const normalized = decisions.map((d) => {
      const constraints = (d.constraintsUsed ?? {}) as Record<string, unknown>;
      return {
        id: d.id,
        createdAt: d.createdAt,
        mode: d.modeUsed,
        groupId: d.groupId,
        winner: d.chosenRestaurant
          ? {
              id: d.chosenRestaurant.id,
              name: d.chosenRestaurant.name,
              priceMin: d.chosenRestaurant.priceMin,
              priceMax: d.chosenRestaurant.priceMax,
              walkMinutes: d.chosenRestaurant.walkMinutes,
              mapsUrl: d.chosenRestaurant.mapsUrl,
            }
          : constraints.soloName
          ? { name: String(constraints.soloName) }
          : null,
      };
    });

    return NextResponse.json({ decisions: normalized });
  } catch (error) {
    console.error('Get decisions error:', error);
    return NextResponse.json({ error: 'Failed to fetch decisions' }, { status: 500 });
  }
}

// POST /api/decisions
// Saves a solo decision to server-side history:
// { mode: 'solo', soloName: string, category?: string }
export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const mode = String(body?.mode || '');
    const soloName = String(body?.soloName || '').trim();
    const category = body?.category ? String(body.category) : null;

    if (mode !== 'solo' || !soloName) {
      return NextResponse.json(
        { error: 'mode=solo and soloName are required' },
        { status: 400 }
      );
    }

    const created = await prisma.lunchDecision.create({
      data: {
        groupId: null,
        decisionDate: new Date(),
        modeUsed: 'solo',
        chosenRestaurantId: null,
        constraintsUsed: {
          soloName,
          category,
        },
        createdBy: userId,
      },
    });

    return NextResponse.json({ success: true, id: created.id });
  } catch (error) {
    console.error('Create solo decision error:', error);
    return NextResponse.json({ error: 'Failed to save solo decision' }, { status: 500 });
  }
}
