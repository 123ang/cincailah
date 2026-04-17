import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { generateResetToken } from '@/lib/auth';
import { sendEmail, getVerificationEmail } from '@/lib/email';
import { reportError } from '@/lib/logger';

export async function POST() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    const token = generateResetToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: token,
        emailVerifyExpires: expires,
      },
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${token}`;
    const emailContent = getVerificationEmail(verifyUrl, user.displayName);

    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError(error, { route: 'auth/send-verification' });
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
  }
}
