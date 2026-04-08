import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: true, message: 'Too many requests, please try again later', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: true, message: 'Too many requests, please try again later', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});
