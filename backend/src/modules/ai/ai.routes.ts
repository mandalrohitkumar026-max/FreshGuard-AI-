import { Router } from 'express';
import { aiController } from './ai.controller';
import { validate } from '../../middleware/zodValidationMiddleware';
import { optionalAuthenticate } from '../../middleware/authenticate';
import { verifyRateLimiter } from '../../middleware/rateLimiter';
import {
  extractClaimsRequestSchema,
  analyzeClaimsRequestSchema,
  analyzeEvidenceRequestSchema,
  generateCorrectionRequestSchema,
} from './ai.validation';

const router = Router();

router.get('/health', aiController.getBifrostHealth);

router.post(
  '/extract-claims',
  optionalAuthenticate,
  verifyRateLimiter,
  validate({ body: extractClaimsRequestSchema.shape.body }),
  aiController.extractClaims,
);

router.post(
  '/analyze-claims',
  optionalAuthenticate,
  verifyRateLimiter,
  validate({ body: analyzeClaimsRequestSchema.shape.body }),
  aiController.analyzeClaims,
);

router.post(
  '/analyze-evidence',
  optionalAuthenticate,
  verifyRateLimiter,
  validate({ body: analyzeEvidenceRequestSchema.shape.body }),
  aiController.analyzeEvidence,
);

router.post(
  '/generate-correction',
  optionalAuthenticate,
  verifyRateLimiter,
  validate({ body: generateCorrectionRequestSchema.shape.body }),
  aiController.generateCorrection,
);

export default router;
