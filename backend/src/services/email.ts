import nodemailer from 'nodemailer';

/**
 * Email configuration via environment variables:
 * - SMTP_HOST, SMTP_PORT, SMTP_SECURE
 * - SMTP_USER, SMTP_PASS (for auth)
 * - FRONTEND_URL: base URL for reset links (e.g. http://localhost:5173)
 * If SMTP is not configured, reset links are logged to console (dev mode).
 */

const FROM = process.env.SMTP_FROM || 'CareerOps <noreply@careerops.local>';

export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function getResetLink(token: string): string {
  const base = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${base}/reset-password?token=${token}`;
}

function createTransporter(): nodemailer.Transporter {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string
): Promise<void> {
  const resetLink = getResetLink(resetToken);

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #667eea;">CareerOps – Reset your password</h2>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <p><a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset password</a></p>
      <p>Or copy this link: <a href="${resetLink}">${resetLink}</a></p>
      <p style="color: #888; font-size: 14px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    </div>
  `;

  if (isSmtpConfigured()) {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: FROM,
      to,
      subject: 'CareerOps – Reset your password',
      html,
    });
  } else {
    console.log('[Email] SMTP not configured. Password reset link (dev):', resetLink);
  }
}
