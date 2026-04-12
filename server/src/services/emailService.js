import { Resend } from 'resend';
import { env } from '../config/env.js';

// Lazily create Resend client so missing key doesn't crash startup
let resend;
function getResend() {
  if (!resend) resend = new Resend(env.RESEND_API_KEY);
  return resend;
}

export async function sendVerificationEmail(email, fullName, token) {
  // Strip trailing slash so the URL is always clean
  const base = env.CLIENT_URL.replace(/\/$/, '');
  const verifyUrl = `${base}/verify-email?token=${token}`;

  // Always print to server console — visible in Render logs.
  // If email fails, the user can still verify by visiting this URL manually.
  console.log(`[Email] Verification URL for ${email}: ${verifyUrl}`);

  if (!env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — skipping email send. Use the URL above to verify manually.');
    return;
  }

  try {
    const result = await getResend().emails.send({
      // Resend free tier: must use onboarding@resend.dev until you verify a domain
      from: 'Niyam AI <onboarding@resend.dev>',
      to: [email],
      subject: 'Verify your Niyam AI account',
      html: `
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
      `,
    });
    console.log('[Email] Verification email sent:', result?.data?.id);
    return result;
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

  if (!env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — skipping email send.');
    return;
  }

  try {
    const result = await getResend().emails.send({
      from: 'Niyam AI <onboarding@resend.dev>',
      to: [email],
      subject: 'Reset your Niyam AI password',
      html: `
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
      `,
    });
    console.log('[Email] Password reset email sent:', result?.data?.id);
    return result;
  } catch (err) {
    console.error('[Email] Failed to send password reset email:', err.message);
    console.log(`[Email] Manual reset URL: ${resetUrl}`);
  }
}
