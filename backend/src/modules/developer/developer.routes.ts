import { Router } from 'express';
import { developerController } from './developerController';
import { requireApiKey } from './developerAuthMiddleware';
import { optionalAuthenticate } from '../../middleware/authenticate';

const router = Router();

// Developer API Key Management
router.post('/keys', optionalAuthenticate, developerController.createKey);
router.get('/keys', optionalAuthenticate, developerController.listKeys);
router.delete('/keys/:id', optionalAuthenticate, developerController.revokeKey);

// Authenticated Developer Endpoints (requireApiKey)
router.post('/verify', requireApiKey, developerController.verify);
router.get('/reports/:id', requireApiKey, developerController.getReport);
router.get('/conflicts/:id', requireApiKey, developerController.getConflicts);
router.get('/audit-trail/:id', requireApiKey, developerController.getAuditTrail);

export default router;
