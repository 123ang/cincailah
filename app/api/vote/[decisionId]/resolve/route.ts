import { NextRequest, NextResponse } from 'next/server';
import { resolveUserId } from '@/lib/session';
import { getDecisionWithMembership } from '@/lib/group-access';
import { reportError } from '@/lib/logger';
import { resolveVote } from '@/lib/vote-finalize';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ decisionId: string }> },
) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { decisionId } = await params;
    const access = await getDecisionWithMembership(decisionId, userId);
    if (access === null) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }
    if (access === false) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await resolveVote(decisionId);
    if (result.status === 'not_found') {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }
    if (result.status === 'open') {
      return NextResponse.json({ error: 'Voting is still open' }, { status: 409 });
    }
    if (result.status === 'invalid') {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      winner: result.winner,
      tiedRestaurantIds: result.tiedRestaurantIds,
    });
  } catch (error) {
    reportError(error, { route: 'vote/resolve' });
    return NextResponse.json({ error: 'Failed to resolve vote' }, { status: 500 });
  }
}
