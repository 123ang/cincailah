import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserId } from '@/lib/session';
import { PreferencesSchema, zodError } from '@/lib/schemas';
import { reportError } from '@/lib/logger';

// GET /api/user/preferences
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    return NextResponse.json({
      preferences: prefs ?? { halal: false, vegOptions: false, defaultBudget: 20 },
    });
  } catch (error) {
    reportError(error, { route: 'preferences/get' });
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

// PATCH /api/user/preferences
export async function PATCH(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = PreferencesSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }

    const { halal, vegOptions, defaultBudget } = parsed.data;

    const prefs = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        ...(halal !== undefined && { halal: Boolean(halal) }),
        ...(vegOptions !== undefined && { vegOptions: Boolean(vegOptions) }),
        ...(defaultBudget !== undefined && { defaultBudget: Number(defaultBudget) }),
      },
      create: {
        userId,
        halal: Boolean(halal ?? false),
        vegOptions: Boolean(vegOptions ?? false),
        defaultBudget: Number(defaultBudget ?? 20),
      },
    });

    return NextResponse.json({ success: true, preferences: prefs });
  } catch (error) {
    reportError(error, { route: 'preferences/patch' });
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
