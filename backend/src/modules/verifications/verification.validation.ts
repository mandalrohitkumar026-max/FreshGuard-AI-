import { z } from 'zod';

export const createVerificationSchema = z.object({
  body: z.object({
    originalAnswer: z
      .string()
      .min(10, 'Answer must be at least 10 characters long')
      .max(10000, 'Answer must not exceed 10,000 characters'),
    topic: z.string().max(100).optional(),
    sourceModel: z.string().max(50).optional(),
    stream: z.boolean().optional(),
  }),
});

export const verificationIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Verification ID is required'),
  }),
});

export const verificationQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    riskLevel: z.enum(['FRESH', 'STALE', 'OUTDATED', 'UNVERIFIABLE']).optional(),
  }).optional(),
});
