import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import {
  listReports,
  getReportBySession,
  downloadReport,
} from '../controllers/reports.controller.js';

const router = Router();
router.use(authMiddleware, apiLimiter);

router.get('/', listReports);
router.get('/:session_id', getReportBySession);
router.get('/:id/download', downloadReport);

export default router;
