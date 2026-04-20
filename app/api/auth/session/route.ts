import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, resolveUserId } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    // Mobile sends `Authorization: Bearer <jwt>`; web uses the iron-session cookie.
    const jwtUserId = await resolveUserId(request);

    if (jwtUserId) {
      const user = await prisma.user.findUnique({
        where: { id: jwtUserId },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          emailVerified: true,
        },
      });
      if (user) {
        const recentMembership = await prisma.groupMember.findFirst({
          where: { userId: user.id },
          orderBy: { joinedAt: 'desc' },
        });
        return NextResponse.json({
          isLoggedIn: true,
          userId: user.id,
          displayName: user.displayName,
          activeGroupId: recentMembership?.groupId ?? null,
          session: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            emailVerified: user.emailVerified,
          },
        });
      }
    }

    const session = await getSession();

    const base = {
      isLoggedIn: session.isLoggedIn || false,
      userId: session.userId || null,
      displayName: session.displayName || null,
      activeGroupId: session.activeGroupId || null,
    };

    if (session.isLoggedIn && session.userId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          emailVerified: true,
        },
      });
      if (user) {
        return NextResponse.json({
          ...base,
          session: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            emailVerified: user.emailVerified,
          },
        });
      }
    }

    return NextResponse.json(base);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}
