import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

function isDueNow(reminderTimeLocal: string, timezone: string, weekdaysOnly: boolean): boolean {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  const localHm = `${hour}:${minute}`;
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';
  if (weekdaysOnly && isWeekend) return false;
  return localHm === reminderTimeLocal;
}

export async function GET(request: NextRequest) {
  const token = request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret');
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      preferences: {
        reminderEnabled: true,
      },
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      preferences: {
        select: {
          reminderEnabled: true,
          reminderTimeLocal: true,
          reminderTimezone: true,
          reminderWeekdaysOnly: true,
        },
      },
      groupMemberships: {
        select: {
          group: { select: { name: true, id: true } },
        },
        take: 1,
      },
    },
  });

  let sent = 0;
  for (const user of users) {
    const p = user.preferences;
    if (!p || !p.reminderEnabled) continue;
    if (!isDueNow(p.reminderTimeLocal, p.reminderTimezone, p.reminderWeekdaysOnly)) continue;

    const group = user.groupMemberships[0]?.group;
    const deepLink = group ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/group/${group.id}` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    await sendEmail({
      to: user.email,
      subject: 'Lunch reminder — time to cincai lah 🍛',
      html: `<p>Hi ${user.displayName},</p><p>It's lunch time. Open Cincailah and decide in 10 seconds.</p><p><a href="${deepLink}">Open Cincailah</a></p>`,
    });
    sent += 1;
  }

  return NextResponse.json({ success: true, scanned: users.length, sent });
}
