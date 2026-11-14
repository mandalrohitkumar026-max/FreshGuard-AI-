import { Router } from 'express';
import { claimController } from './claim.controller';
import { validate } from '../../middleware/zodValidationMiddleware';
import { optionalAuthenticate } from '../../middleware/authenticate';
import { verifyRateLimiter } from '../../middleware/rateLimiter';
import { extractClaimsApiRequestSchema } from './claim.validation';

const router = Router();

router.post(
  '/extract',
  optionalAuthenticate,
  verifyRateLimiter,
  validate({ body: extractClaimsApiRequestSchema.shape.body }),
  claimController.extractClaims,
);

router.get(
  '/verification/:verificationId',
  optionalAuthenticate,
  claimController.getClaimsByVerification,
);

export default router;
