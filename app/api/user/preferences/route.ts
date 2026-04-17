import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { PreferencesSchema, zodError } from '@/lib/schemas';

// GET /api/user/preferences
export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: session.userId },
    });

    return NextResponse.json({ preferences: prefs ?? { halal: false, vegOptions: false, defaultBudget: 20 } });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

// PATCH /api/user/preferences
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = PreferencesSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }

    const { halal, vegOptions, defaultBudget } = parsed.data;

    const prefs = await prisma.userPreferences.upsert({
      where: { userId: session.userId },
      update: {
        ...(halal !== undefined && { halal: Boolean(halal) }),
        ...(vegOptions !== undefined && { vegOptions: Boolean(vegOptions) }),
        ...(defaultBudget !== undefined && { defaultBudget: Number(defaultBudget) }),
      },
      create: {
        userId: session.userId,
        halal: Boolean(halal ?? false),
        vegOptions: Boolean(vegOptions ?? false),
        defaultBudget: Number(defaultBudget ?? 20),
      },
    });

    return NextResponse.json({ success: true, preferences: prefs });
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
