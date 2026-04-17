import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateResetToken } from '@/lib/auth';
import { sendEmail, getPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailLower = email.trim().toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a reset link will be sent',
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    // Save token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    // Send password reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const emailContent = getPasswordResetEmail(resetUrl, user.displayName);

    const emailResult = await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    // Log for development
    if (process.env.NODE_ENV === 'development' || emailResult.devMode) {
      console.log('='.repeat(60));
      console.log('PASSWORD RESET REQUEST');
      console.log('='.repeat(60));
      console.log(`Email: ${user.email}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log(`Token expires: ${resetTokenExpires.toLocaleString()}`);
      console.log('Email sent:', emailResult.success ? '✓' : '✗ (dev mode)');
      console.log('='.repeat(60));
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists, a reset link will be sent',
      // Only include in development
      ...(process.env.NODE_ENV === 'development' && { resetUrl }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
