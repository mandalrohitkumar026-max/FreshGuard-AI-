import { Router } from 'express';
import { register, login, refresh, logout, getMe } from '../controllers/authController';
import { validate } from '../middleware/zodValidationMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';
import { authRateLimit } from '../middleware/rateLimitMiddleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../schemas/validationSchemas';

const router = Router();

router.post('/register', authRateLimit, validate({ body: registerSchema.shape.body }), register);
router.post('/login', authRateLimit, validate({ body: loginSchema.shape.body }), login);
router.post('/refresh', validate({ body: refreshTokenSchema.shape.body }), refresh);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);

export default router;
