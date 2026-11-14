import { Router } from 'express';
import { freshnessController } from './freshness.controller';
import { validate } from '../../middleware/zodValidationMiddleware';
import { optionalAuthenticate } from '../../middleware/authenticate';
import { verifyRateLimiter } from '../../middleware/rateLimiter';
import { analyzeFreshnessApiRequestSchema } from './freshness.validation';

const router = Router();

router.post(
  '/analyze',
  optionalAuthenticate,
  verifyRateLimiter,
  validate({ body: analyzeFreshnessApiRequestSchema.shape.body }),
  freshnessController.analyzeFreshness,
);

router.get(
  '/:verificationId',
  optionalAuthenticate,
  freshnessController.getFreshnessByVerificationId,
);

export default router;
