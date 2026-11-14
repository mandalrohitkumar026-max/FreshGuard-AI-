import { Router } from 'express';
import { integrationsController } from './integrations.controller';
import { aiController } from '../ai/ai.controller';
import { searchController } from '../search/search.controller';

const router = Router();

router.get('/status', integrationsController.getStatus);
router.get('/bifrost/health', aiController.getBifrostHealth);
router.get('/tavily/health', searchController.getTavilyHealth);

export default router;
