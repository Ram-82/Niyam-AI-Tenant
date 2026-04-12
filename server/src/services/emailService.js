import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../config/env.js';

// ─── Gmail SMTP (preferred — works without a custom domain) ───────────────────
function getGmailTransport() {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
  });
}

// ─── Resend SDK (fallback — requires verified domain for arbitrary recipients) ─
let resend;
function getResend() {
  if (!resend) resend = new Resend(env.RESEND_API_KEY);
  return resend;
}

// ─── Shared send helper ───────────────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  const gmail = getGmailTransport();

  if (gmail) {
    // Gmail SMTP path
    const info = await gmail.sendMail({
      from: `"Niyam AI" <${env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('[Email] Sent via Gmail SMTP, messageId:', info.messageId);
    return;
  }

  if (env.RESEND_API_KEY) {
    // Resend path — NOTE: free tier only delivers to the Resend account owner's
    // email unless you have a verified domain at resend.com/domains
    const { data, error } = await getResend().emails.send({
      from: 'Niyam AI <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    });
    if (error) {
      console.error('[Email] Resend API error:', JSON.stringify(error));
      return;
    }
    console.log('[Email] Sent via Resend, id:', data?.id);
    return;
  }

  console.warn('[Email] No email provider configured (set GMAIL_USER + GMAIL_APP_PASSWORD in Render env vars).');
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function sendVerificationEmail(email, fullName, token) {
  const base = env.CLIENT_URL.replace(/\/$/, '');
  const verifyUrl = `${base}/verify-email?token=${token}`;

  // Always log — visible in Render logs as a manual fallback
  console.log(`[Email] Verification URL for ${email}: ${verifyUrl}`);

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <div style="background:#1A1A2E;padding:20px;border-radius:8px;margin-bottom:24px;">
        <h1 style="color:#E86B2E;margin:0;font-size:22px;">Niyam AI</h1>
        <p style="color:#ffffff99;margin:4px 0 0;font-size:13px;">GST Pre-Filing Intelligence</p>
      </div>
      <h2 style="color:#1A1A2E;">Welcome, ${fullName}!</h2>
      <p style="color:#374151;">Click the button below to verify your email and activate your account.</p>
      <a href="${verifyUrl}"
         style="display:inline-block;padding:14px 32px;background:#E86B2E;color:#fff;
                border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;
                margin:16px 0;">
        Verify Email Address
      </a>
      <p style="color:#6B7280;font-size:12px;margin-top:24px;border-top:1px solid #E5E2DC;padding-top:16px;">
        This link expires in 24 hours. If you did not sign up for Niyam AI, you can safely ignore this email.
      </p>
    </div>
  `;

  try {
    await sendEmail({ to: email, subject: 'Verify your Niyam AI account', html });
  } catch (err) {
    console.error('[Email] Failed to send verification email:', err.message);
    console.log(`[Email] Manual verification URL: ${verifyUrl}`);
    // Don't throw — account is created, user can verify via Render logs
  }
}

export async function sendPasswordResetEmail(email, fullName, token) {
  const base = env.CLIENT_URL.replace(/\/$/, '');
  const resetUrl = `${base}/reset-password?token=${token}`;

  console.log(`[Email] Password reset URL for ${email}: ${resetUrl}`);

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <div style="background:#1A1A2E;padding:20px;border-radius:8px;margin-bottom:24px;">
        <h1 style="color:#E86B2E;margin:0;font-size:22px;">Niyam AI</h1>
      </div>
      <h2 style="color:#1A1A2E;">Password Reset</h2>
      <p style="color:#374151;">Hi ${fullName}, you requested a password reset.</p>
      <a href="${resetUrl}"
         style="display:inline-block;padding:14px 32px;background:#E86B2E;color:#fff;
                border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;
                margin:16px 0;">
        Reset Password
      </a>
      <p style="color:#6B7280;font-size:12px;margin-top:24px;border-top:1px solid #E5E2DC;padding-top:16px;">
        This link expires in 1 hour. If you did not request this, ignore this email.
      </p>
    </div>
  `;

  try {
    await sendEmail({ to: email, subject: 'Reset your Niyam AI password', html });
  } catch (err) {
    console.error('[Email] Failed to send password reset email:', err.message);
    console.log(`[Email] Manual reset URL: ${resetUrl}`);
  }
}
