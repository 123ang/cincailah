import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteUserAccount } from '@/lib/account-deletion';
import { resolveUserIdWithSession } from '@/lib/session';
import { reportError } from '@/lib/logger';

// DELETE /api/user/account — permanently delete the signed-in account.
export async function DELETE(request: NextRequest) {
  try {
    const { userId, session } = await resolveUserIdWithSession(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteUserAccount(prisma, userId);
    session?.destroy();

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError(error, { route: 'user/account/delete' });
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
