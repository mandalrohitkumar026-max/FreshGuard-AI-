import { Router } from 'express';
import {
  getReport,
  listReports,
  shareReport,
  getPublicReport,
} from '../controllers/reportController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public report (no auth)
router.get('/public/:slug', getPublicReport);

// All other report routes require auth
router.use(authMiddleware);

router.get('/', listReports);
router.get('/:reportId', getReport);
router.post('/:reportId/share', shareReport);

export default router;
