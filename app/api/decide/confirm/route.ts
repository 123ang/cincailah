import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { ConfirmDecisionSchema, zodError } from '@/lib/schemas';
import { logRequest } from '@/lib/logger';

// POST /api/decide/confirm — explicitly marks a decision as "confirmed" (i.e., we're going).
// This is cleaner than relying on reroll-overwrite logic.
// Currently sets the decision's modeUsed to 'you_pick_confirmed'.
export async function POST(request: NextRequest) {
  logRequest(request);
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = ConfirmDecisionSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }

    const { decisionId } = parsed.data;

    const decision = await prisma.lunchDecision.findUnique({
      where: { id: decisionId },
      include: { chosenRestaurant: true },
    });

    if (!decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }

    if (decision.createdBy !== session.userId) {
      return NextResponse.json({ error: 'Not your decision' }, { status: 403 });
    }

    const confirmed = await prisma.lunchDecision.update({
      where: { id: decisionId },
      data: { modeUsed: 'you_pick_confirmed' },
      include: { chosenRestaurant: true },
    });

    return NextResponse.json({ success: true, decision: confirmed });
  } catch (error) {
    console.error('Confirm decision error:', error);
    return NextResponse.json({ error: 'Failed to confirm decision' }, { status: 500 });
  }
}
