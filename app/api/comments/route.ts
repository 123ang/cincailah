import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET /api/comments?decisionId=...
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const decisionId = searchParams.get('decisionId');

    if (!decisionId) {
      return NextResponse.json({ error: 'decisionId is required' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { decisionId },
      include: { user: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { decisionId, body: commentBody } = body;

    if (!decisionId || !commentBody?.trim()) {
      return NextResponse.json({ error: 'decisionId and body are required' }, { status: 400 });
    }

    if (commentBody.trim().length > 500) {
      return NextResponse.json({ error: 'Comment must be under 500 characters' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        decisionId,
        userId: session.userId,
        body: commentBody.trim(),
      },
      include: { user: { select: { id: true, displayName: true } } },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
