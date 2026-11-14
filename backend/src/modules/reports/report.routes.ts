import { Router } from 'express';
import { reportController } from './report.controller';
import { optionalAuthenticate } from '../../middleware/authenticate';

const router = Router();

router.get('/:id', optionalAuthenticate, reportController.getReport);
router.post('/:id/share', optionalAuthenticate, reportController.shareReport);

export default router;
