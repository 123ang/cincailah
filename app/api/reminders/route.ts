import { NextRequest, NextResponse } from 'next/server';
import { resolveUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { ReminderSchema, zodError } from '@/lib/schemas';
import { reportError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId },
      select: {
        reminderEnabled: true,
        reminderTimeLocal: true,
        reminderTimezone: true,
        reminderWeekdaysOnly: true,
      },
    });

    return NextResponse.json({
      reminder: {
        enabled: prefs?.reminderEnabled ?? false,
        reminderTimeLocal: prefs?.reminderTimeLocal ?? '11:45',
        timezone: prefs?.reminderTimezone ?? 'Asia/Kuala_Lumpur',
        weekdaysOnly: prefs?.reminderWeekdaysOnly ?? true,
      },
    });
  } catch (error) {
    reportError(error, { route: 'reminders/get' });
    return NextResponse.json({ error: 'Failed to fetch reminder' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = ReminderSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }

    const { enabled, reminderTimeLocal, timezone, weekdaysOnly } = parsed.data;

    const prefs = await prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        reminderEnabled: enabled,
        reminderTimeLocal,
        reminderTimezone: timezone,
        reminderWeekdaysOnly: weekdaysOnly,
      },
      update: {
        reminderEnabled: enabled,
        reminderTimeLocal,
        reminderTimezone: timezone,
        reminderWeekdaysOnly: weekdaysOnly,
      },
      select: {
        reminderEnabled: true,
        reminderTimeLocal: true,
        reminderTimezone: true,
        reminderWeekdaysOnly: true,
      },
    });

    return NextResponse.json({
      success: true,
      reminder: {
        enabled: prefs.reminderEnabled,
        reminderTimeLocal: prefs.reminderTimeLocal,
        timezone: prefs.reminderTimezone,
        weekdaysOnly: prefs.reminderWeekdaysOnly,
      },
    });
  } catch (error) {
    reportError(error, { route: 'reminders/post' });
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
  }
}
