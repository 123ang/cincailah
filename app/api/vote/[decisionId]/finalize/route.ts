import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserId } from '@/lib/session';
import { getDecisionWithMembership } from '@/lib/group-access';
import { reportError } from '@/lib/logger';
import { canFinalizeVote } from '@/lib/vote-resolution';
import { resolveVote } from '@/lib/vote-finalize';

/** Finalise button: close a We Fight vote now instead of waiting for the timer. */
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

    const decision = await prisma.lunchDecision.findUnique({
      where: { id: decisionId },
      select: { createdBy: true, modeUsed: true, group: { select: { createdBy: true } } },
    });
    if (!decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }
    if (decision.modeUsed !== 'we_fight') {
      return NextResponse.json({ error: 'Only group votes can be finalised' }, { status: 400 });
    }
    if (
      !canFinalizeVote({
        userId,
        decisionCreatorId: decision.createdBy,
        groupOwnerId: decision.group?.createdBy,
      })
    ) {
      return NextResponse.json(
        { error: 'Only the person who started the vote or the group owner can finalise it' },
        { status: 403 },
      );
    }

    const result = await resolveVote(decisionId, { closeNow: true });
    if (result.status === 'not_found') {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }
    if (result.status !== 'resolved') {
      return NextResponse.json(
        { error: result.status === 'invalid' ? result.error : 'Could not finalise vote' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      winner: result.winner,
      tiedRestaurantIds: result.tiedRestaurantIds,
    });
  } catch (error) {
    reportError(error, { route: 'vote/finalize' });
    return NextResponse.json({ error: 'Failed to finalise vote' }, { status: 500 });
  }
}
