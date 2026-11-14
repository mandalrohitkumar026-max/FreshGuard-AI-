import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { Request, Response } from 'express';

const rateLimitResponse = (message: string) => ({
  success: false,
  error: { code: 'RATE_LIMIT_EXCEEDED', message },
});

/** General API rate limit — 60 req/min per IP */
export const generalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_GENERAL,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json(rateLimitResponse('Too many requests. Please slow down.'));
  },
});

/** Verification rate limit — 5 verifications/min per IP */
export const verifyRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_VERIFY,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId ?? req.ip ?? 'anonymous',
  handler: (_req: Request, res: Response) => {
    res.status(429).json(rateLimitResponse('Verification rate limit reached. Try again in a minute.'));
  },
});

/** Auth rate limit — 10 attempts per 15 min per IP */
export const authRateLimit = rateLimit({
  windowMs: 900_000, // 15 minutes
  max: env.RATE_LIMIT_MAX_AUTH,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json(rateLimitResponse('Too many auth attempts. Try again in 15 minutes.'));
  },
});
