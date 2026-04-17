import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'Cincailah <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const APP_NAME = 'Cincailah';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      '⚠️  RESEND_API_KEY not set. Email would have been sent to:',
      to
    );
    console.log('Subject:', subject);
    console.log('HTML Preview:', html.substring(0, 200) + '...');
    return { success: false, devMode: true };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || stripHtml(html),
    });

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Email templates

export function getPasswordResetEmail(resetUrl: string, displayName: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🍛</div>
              <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800; color: #0F172A;">Reset your password</h1>
              <p style="margin: 0; font-size: 16px; color: #64748B;">Hi ${displayName},</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #475569;">
                We received a request to reset your password for your ${APP_NAME} account. Click the button below to set a new password:
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
                  Reset Password
                </a>
              </div>
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #64748B;">
                This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 13px; color: #94A3B8; text-align: center;">
                If the button doesn't work, copy and paste this link:<br/>
                <a href="${resetUrl}" style="color: #DC2626; word-break: break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0 0; font-size: 13px; color: #94A3B8; text-align: center;">
          ${APP_NAME} &middot; Cincai lah!
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return {
    subject: `Reset your ${APP_NAME} password`,
    html,
  };
}

export function getWelcomeEmail(displayName: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${APP_NAME}!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
              <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 800; color: #0F172A;">Welcome to ${APP_NAME}!</h1>
              <p style="margin: 0; font-size: 18px; color: #64748B;">Hi ${displayName}, glad you're here! 👋</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #475569;">
                You've just joined the easiest way to decide where to makan with your crew. No more endless WhatsApp polls!
              </p>
              
              <div style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #ffffff;">Quick Start:</h2>
                <ol style="margin: 0; padding-left: 20px; color: #ffffff; font-size: 15px; line-height: 1.8;">
                  <li>Create your first makan group</li>
                  <li>Add your favourite restaurants</li>
                  <li>Hit <strong>"Cincai lah!"</strong> and let us pick</li>
                </ol>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 16px; line-height: 1.6; color: #475569;">
                Pro tip: Try <strong>Solo Mode</strong> first to see the magic. No group required! 🎲
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${APP_URL}" style="display: inline-block; background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
                  Get Started
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 13px; color: #94A3B8; text-align: center;">
                Questions? Feedback? We'd love to hear from you!<br/>
                <a href="mailto:support@cincailah.com" style="color: #DC2626;">support@cincailah.com</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0 0; font-size: 13px; color: #94A3B8; text-align: center;">
          ${APP_NAME} &middot; Cincai lah!
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return {
    subject: `Welcome to ${APP_NAME}! 🍛`,
    html,
  };
}

export function getVerificationEmail(verifyUrl: string, displayName: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">✉️</div>
              <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800; color: #0F172A;">Verify your email</h1>
              <p style="margin: 0; font-size: 16px; color: #64748B;">Hi ${displayName},</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #475569;">
                Thanks for signing up! Please verify your email address to unlock all ${APP_NAME} features:
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #34D399 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                  Verify Email
                </a>
              </div>
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #64748B;">
                This link will expire in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 13px; color: #94A3B8; text-align: center;">
                If the button doesn't work, copy and paste this link:<br/>
                <a href="${verifyUrl}" style="color: #10B981; word-break: break-all;">${verifyUrl}</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0 0; font-size: 13px; color: #94A3B8; text-align: center;">
          ${APP_NAME} &middot; Cincai lah!
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return {
    subject: `Verify your ${APP_NAME} email`,
    html,
  };
}
