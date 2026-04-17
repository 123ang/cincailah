import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { ReminderSchema, zodError } from '@/lib/schemas';

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: session.userId },
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
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = ReminderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(zodError(parsed.error), { status: 400 });
  }

  const { enabled, reminderTimeLocal, timezone, weekdaysOnly } = parsed.data;

  const prefs = await prisma.userPreferences.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
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
}
