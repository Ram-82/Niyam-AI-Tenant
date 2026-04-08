import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import {
  createSession,
  getSession,
  getSessionResults,
} from '../controllers/sessions.controller.js';

const router = Router();
router.use(authMiddleware, apiLimiter);

router.post('/', createSession);
router.get('/:id', getSession);
router.get('/:id/results', getSessionResults);

export default router;
