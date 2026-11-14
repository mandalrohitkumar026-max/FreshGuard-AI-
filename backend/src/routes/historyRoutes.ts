import { Router } from 'express';
import { getHistory, getAnalytics } from '../controllers/historyController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getHistory);
router.get('/analytics', getAnalytics);

export default router;
