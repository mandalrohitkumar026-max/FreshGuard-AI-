import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/zodValidationMiddleware';
import { authenticate } from '../../middleware/authenticate';
import { authRateLimiter } from '../../middleware/rateLimiter';
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
} from './auth.validation';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validate({ body: registerValidation.shape.body }),
  authController.register,
);

router.post(
  '/login',
  authRateLimiter,
  validate({ body: loginValidation.shape.body }),
  authController.login,
);

router.post(
  '/refresh',
  validate({ body: refreshTokenValidation.shape.body }),
  authController.refresh,
);

router.post('/logout', authenticate, authController.logout);

router.get('/me', authenticate, authController.getMe);

export default router;
