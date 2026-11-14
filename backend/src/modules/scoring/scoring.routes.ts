import { Router } from 'express';
import { scoringController } from './scoringController';
import { optionalAuthenticate } from '../../middleware/authenticate';

const router = Router();

router.get('/config', scoringController.getConfig);
router.post('/evaluate-claim', optionalAuthenticate, scoringController.evaluateClaim);
router.post('/evaluate-answer', optionalAuthenticate, scoringController.evaluateAnswer);
router.post('/recalculate/:sessionId', optionalAuthenticate, scoringController.recalculateSession);

export default router;
