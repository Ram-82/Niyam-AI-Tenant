import bcrypt from 'bcrypt';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { generateToken, sanitizeObject } from '../utils/helpers.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { env } from '../config/env.js';

const signupSchema = z.object({
  full_name: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(100).regex(/^[a-z0-9_]+$/, 'Username must be lowercase letters, numbers, underscores'),
  phone: z.string().max(15).optional(),
  firm_name: z.string().max(255).optional(),
  membership_number: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  // 'none' required when frontend (Vercel) and backend (Render) are on different domains.
  // 'none' must be paired with secure:true, so in dev we use 'lax'.
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function signup(req, res, next) {
  try {
    const body = signupSchema.parse(sanitizeObject(req.body));

    // Check existing email/username
    const { data: existing } = await supabaseAdmin
      .from('cas')
      .select('id')
      .or(`email.eq.${body.email},username.eq.${body.username}`)
      .single();

    if (existing) {
      return res.status(400).json({ error: true, message: 'Email or username already in use', code: 'DUPLICATE' });
    }

    const password_hash = await bcrypt.hash(body.password, 12);
    const skipVerification = env.SKIP_EMAIL_VERIFICATION === 'true';
    const email_verification_token = skipVerification ? null : generateToken();

    const { data: ca, error } = await supabaseAdmin
      .from('cas')
      .insert({
        full_name: body.full_name,
        email: body.email,
        password_hash,
        username: body.username,
        phone: body.phone || null,
        firm_name: body.firm_name || null,
        membership_number: body.membership_number || null,
        city: body.city || null,
        email_verification_token,
        is_email_verified: skipVerification,
      })
      .select('id, full_name, email')
      .single();

    if (error) throw error;

    if (skipVerification) {
      return res.status(201).json({ message: 'Account created. You can now sign in.', verified: true });
    }

    await sendVerificationEmail(body.email, body.full_name, email_verification_token);

    return res.status(201).json({ message: 'Account created. Check your email to verify your account.' });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: true, message: 'Token required', code: 'TOKEN_REQUIRED' });
    }

    const { data: ca, error } = await supabaseAdmin
      .from('cas')
      .select('id, is_email_verified')
      .eq('email_verification_token', token)
      .single();

    if (error || !ca) {
      return res.status(400).json({ error: true, message: 'Invalid or expired token', code: 'INVALID_TOKEN' });
    }

    if (ca.is_email_verified) {
      return res.redirect(`${env.CLIENT_URL}/login?verified=already`);
    }

    await supabaseAdmin
      .from('cas')
      .update({ is_email_verified: true, email_verification_token: null, updated_at: new Date().toISOString() })
      .eq('id', ca.id);

    return res.redirect(`${env.CLIENT_URL}/login?verified=true`);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const { data: ca, error } = await supabaseAdmin
      .from('cas')
      .select('id, email, password_hash, full_name, firm_name, username, phone, city, membership_number, is_email_verified')
      .eq('email', email)
      .single();

    if (error || !ca) {
      return res.status(401).json({ error: true, message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    const valid = await bcrypt.compare(password, ca.password_hash);
    if (!valid) {
      return res.status(401).json({ error: true, message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    if (!ca.is_email_verified) {
      return res.status(401).json({ error: true, message: 'Please verify your email before logging in', code: 'EMAIL_NOT_VERIFIED' });
    }

    const tokenPayload = { caId: ca.id, email: ca.email };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    await supabaseAdmin
      .from('cas')
      .update({ refresh_token: refreshToken, updated_at: new Date().toISOString() })
      .eq('id', ca.id);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    const { password_hash, refresh_token, ...caData } = ca;
    return res.json({ accessToken, ca: caData });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ error: true, message: 'No refresh token', code: 'UNAUTHORIZED' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ error: true, message: 'Invalid refresh token', code: 'INVALID_TOKEN' });
    }

    const { data: ca } = await supabaseAdmin
      .from('cas')
      .select('id, email, refresh_token')
      .eq('id', decoded.caId)
      .single();

    if (!ca || ca.refresh_token !== token) {
      return res.status(401).json({ error: true, message: 'Refresh token revoked', code: 'TOKEN_REVOKED' });
    }

    const accessToken = signAccessToken({ caId: ca.id, email: ca.email });
    return res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        await supabaseAdmin
          .from('cas')
          .update({ refresh_token: null, updated_at: new Date().toISOString() })
          .eq('id', decoded.caId);
      } catch {}
    }
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const { data: ca } = await supabaseAdmin
      .from('cas')
      .select('id, full_name, email')
      .eq('email', email)
      .single();

    // Always return success to prevent email enumeration
    if (ca) {
      const resetToken = generateToken();
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await supabaseAdmin
        .from('cas')
        .update({ email_verification_token: `reset_${resetToken}_${resetExpiry}`, updated_at: new Date().toISOString() })
        .eq('id', ca.id);
      await sendPasswordResetEmail(ca.email, ca.full_name, resetToken);
    }

    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const { data: ca, error } = await supabaseAdmin
      .from('cas')
      .select('id, email, full_name, firm_name, username, phone, city, membership_number, created_at')
      .eq('id', req.caId)
      .single();

    if (error || !ca) {
      return res.status(404).json({ error: true, message: 'CA not found', code: 'NOT_FOUND' });
    }
    return res.json(ca);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const body = z.object({
      full_name: z.string().min(2).max(255).optional(),
      phone: z.string().max(15).optional().nullable(),
      firm_name: z.string().max(255).optional().nullable(),
      membership_number: z.string().max(50).optional().nullable(),
      city: z.string().max(100).optional().nullable(),
    }).parse(sanitizeObject(req.body));

    const { data: ca, error } = await supabaseAdmin
      .from('cas')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', req.caId)
      .select('id, email, full_name, firm_name, username, phone, city, membership_number')
      .single();

    if (error) throw error;
    return res.json(ca);
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = z.object({
      current_password: z.string().min(1),
      new_password: z.string().min(8),
    }).parse(req.body);

    const { data: ca } = await supabaseAdmin
      .from('cas')
      .select('password_hash')
      .eq('id', req.caId)
      .single();

    const valid = await bcrypt.compare(current_password, ca.password_hash);
    if (!valid) {
      return res.status(401).json({ error: true, message: 'Current password is incorrect', code: 'INVALID_CREDENTIALS' });
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await supabaseAdmin
      .from('cas')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('id', req.caId);

    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = z.object({
      token: z.string().min(1),
      password: z.string().min(8),
    }).parse(req.body);

    const { data: cas } = await supabaseAdmin
      .from('cas')
      .select('id, email_verification_token')
      .ilike('email_verification_token', `reset_${token}_%`);

    if (!cas?.length) {
      return res.status(400).json({ error: true, message: 'Invalid or expired token', code: 'INVALID_TOKEN' });
    }

    const ca = cas[0];
    const parts = ca.email_verification_token.split('_');
    const expiry = new Date(parts[parts.length - 1]);
    if (expiry < new Date()) {
      return res.status(400).json({ error: true, message: 'Reset token has expired', code: 'TOKEN_EXPIRED' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    await supabaseAdmin
      .from('cas')
      .update({ password_hash, email_verification_token: null, updated_at: new Date().toISOString() })
      .eq('id', ca.id);

    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
}
