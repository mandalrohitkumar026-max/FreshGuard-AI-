import { Router } from 'express';
import { freshnessWatchController } from './freshnessWatchController';
import { optionalAuthenticate } from '../../middleware/authenticate';

const router = Router();

router.post('/', optionalAuthenticate, freshnessWatchController.createWatch);
router.get('/', optionalAuthenticate, freshnessWatchController.listWatches);
router.get('/alerts', optionalAuthenticate, freshnessWatchController.getAlerts);
router.get('/:id', optionalAuthenticate, freshnessWatchController.getWatch);
router.post('/:id/check', optionalAuthenticate, freshnessWatchController.triggerCheck);
router.patch('/:id/toggle', optionalAuthenticate, freshnessWatchController.toggleWatch);
router.delete('/:id', optionalAuthenticate, freshnessWatchController.cancelWatch);

export default router;
