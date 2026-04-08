import { Router } from 'express';
import { authLimiter, apiLimiter } from '../middleware/rateLimiter.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  signup,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/signup', authLimiter, signup);
router.get('/verify-email', verifyEmail);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected
router.get('/me', authMiddleware, apiLimiter, getMe);
router.put('/profile', authMiddleware, apiLimiter, updateProfile);
router.post('/change-password', authMiddleware, apiLimiter, changePassword);

export default router;
