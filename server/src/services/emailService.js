import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;

function getTransporter() {
  if (!transporter) {
    if (env.RESEND_API_KEY) {
      transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: { user: 'resend', pass: env.RESEND_API_KEY },
      });
    } else {
      // Fallback: log emails in development
      transporter = nodemailer.createTransport({ jsonTransport: true });
    }
  }
  return transporter;
}

export async function sendVerificationEmail(email, fullName, token) {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
  const mailOptions = {
    from: `"Niyam AI" <${env.EMAIL_FROM}>`,
    to: email,
    subject: 'Verify your Niyam AI account',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1A1A2E;">Welcome to Niyam AI, ${fullName}!</h2>
        <p>Please verify your email address to get started.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 28px;background:#E86B2E;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
          Verify Email
        </a>
        <p style="color:#6B7280;font-size:13px;margin-top:20px;">
          This link expires in 24 hours. If you didn't sign up, ignore this email.
        </p>
      </div>
    `,
  };

  try {
    const result = await getTransporter().sendMail(mailOptions);
    if (env.NODE_ENV === 'development') {
      console.log('[Email] Verification email:', verifyUrl);
    }
    return result;
  } catch (err) {
    console.error('[Email] Failed to send verification email:', err.message);
    // Don't throw — log and continue
  }
}

export async function sendPasswordResetEmail(email, fullName, token) {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
  const mailOptions = {
    from: `"Niyam AI" <${env.EMAIL_FROM}>`,
    to: email,
    subject: 'Reset your Niyam AI password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1A1A2E;">Password Reset</h2>
        <p>Hi ${fullName}, you requested a password reset.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#E86B2E;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
          Reset Password
        </a>
        <p style="color:#6B7280;font-size:13px;margin-top:20px;">
          This link expires in 1 hour. If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  };

  try {
    const result = await getTransporter().sendMail(mailOptions);
    if (env.NODE_ENV === 'development') {
      console.log('[Email] Password reset email:', resetUrl);
    }
    return result;
  } catch (err) {
    console.error('[Email] Failed to send password reset email:', err.message);
  }
}
