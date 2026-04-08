import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import {
  createClient,
  listClients,
  getClient,
  updateClient,
  deleteClient,
} from '../controllers/clients.controller.js';

const router = Router();
router.use(authMiddleware, apiLimiter);

router.get('/', listClients);
router.post('/', createClient);
router.get('/:id', getClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export default router;
