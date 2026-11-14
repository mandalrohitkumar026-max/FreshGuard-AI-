import { z } from 'zod';

// ── Auth Schemas ──────────────────────────────

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address').toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

// ── Verification Schemas ──────────────────────

export const verifyAnswerSchema = z.object({
  body: z.object({
    answerText: z
      .string()
      .min(50, 'Answer must be at least 50 characters')
      .max(10000, 'Answer must not exceed 10,000 characters'),
    context: z
      .object({
        topic: z.string().max(100).optional(),
        sourceModel: z.string().max(50).optional(),
      })
      .optional(),
  }),
});

// ── History Query Schemas ─────────────────────

export const historyQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    riskLevel: z.enum(['FRESH', 'STALE', 'OUTDATED', 'UNVERIFIABLE']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

// ── Type exports ──────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type VerifyAnswerInput = z.infer<typeof verifyAnswerSchema>['body'];
export type HistoryQuery = z.infer<typeof historyQuerySchema>['query'];
