import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    return NextResponse.json({
      isLoggedIn: session.isLoggedIn || false,
      userId: session.userId || null,
      displayName: session.displayName || null,
      activeGroupId: session.activeGroupId || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}
