import { Router } from 'express';
import { startVerification, getSessionStatus } from '../controllers/verifyController';
import { authMiddleware } from '../middleware/authMiddleware';
import { verifyRateLimit } from '../middleware/rateLimitMiddleware';
import { validate } from '../middleware/zodValidationMiddleware';
import { verifyAnswerSchema } from '../schemas/validationSchemas';

const router = Router();

// All verify routes require authentication
router.use(authMiddleware);

/**
 * POST /api/v1/verify
 * Starts verification — opens an SSE stream immediately.
 */
router.post(
  '/',
  verifyRateLimit,
  validate({ body: verifyAnswerSchema.shape.body }),
  startVerification,
);

/**
 * GET /api/v1/verify/:sessionId
 * Poll session status (alternative to SSE).
 */
router.get('/:sessionId', getSessionStatus);

export default router;
