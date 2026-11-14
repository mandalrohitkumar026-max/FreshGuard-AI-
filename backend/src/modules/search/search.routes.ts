import { Router } from 'express';
import { searchController } from './search.controller';
import { validate } from '../../middleware/zodValidationMiddleware';
import { optionalAuthenticate } from '../../middleware/authenticate';
import { verifyRateLimiter } from '../../middleware/rateLimiter';
import {
  searchQueryRequestSchema,
  claimEvidenceRequestSchema,
} from './search.validation';

const router = Router();

router.get('/health', searchController.getTavilyHealth);
router.get('/history', optionalAuthenticate, searchController.getSearchHistory);

router.post(
  '/query',
  optionalAuthenticate,
  verifyRateLimiter,
  validate({ body: searchQueryRequestSchema.shape.body }),
  searchController.searchQuery,
);

router.post(
  '/evidence',
  optionalAuthenticate,
  verifyRateLimiter,
  validate({ body: claimEvidenceRequestSchema.shape.body }),
  searchController.searchEvidence,
);

export default router;
