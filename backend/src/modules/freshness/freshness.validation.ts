import { z } from 'zod';

export const freshnessPrioritySchema = z.enum(['HIGH', 'MEDIUM', 'LOW', 'STABLE']);

export const volatilityLevelSchema = z.enum([
  'VERY_HIGH',
  'HIGH',
  'MODERATE',
  'LOW',
  'STABLE',
]);

export const verificationDecisionSchema = z.enum([
  'VERIFY_IMMEDIATELY',
  'VERIFY_LIVE',
  'VERIFY_IF_NEEDED',
  'NOT_REQUIRED',
]);

export const recommendedSearchStrategySchema = z.enum([
  'OFFICIAL_RELEASE_SEARCH',
  'LEADERSHIP_EXECUTIVE_SEARCH',
  'REALTIME_FINANCIAL_LOOKUP',
  'GOVERNMENT_REGULATION_SEARCH',
  'ACADEMIC_DEADLINE_SEARCH',
  'GENERAL_WEB_SEARCH',
  'SKIP_VERIFICATION',
]);

export const detectionMethodSchema = z.enum([
  'BIFROST_SEMANTIC',
  'DETERMINISTIC_RULES',
  'HYBRID',
]);

export const claimTemporalAnalysisSchema = z.object({
  claimId: z.string().min(1),
  claimText: z.string().min(1),
  isTimeSensitive: z.boolean(),
  priority: freshnessPrioritySchema,
  volatility: volatilityLevelSchema,
  decision: verificationDecisionSchema,
  requiresVerification: z.boolean(),
  category: z.string().default('GENERAL'),
  reason: z.string().min(1),
  recommendedSearchStrategy: recommendedSearchStrategySchema,
  preferredSourceType: z.string().default('general'),
  detectionMethod: detectionMethodSchema.default('HYBRID'),
  confidence: z.number().min(0).max(1).default(0.9),
});

export const freshnessAnalysisResponseSchema = z.object({
  verificationId: z.string(),
  totalClaims: z.number().min(0),
  timeSensitiveCount: z.number().min(0),
  stableCount: z.number().min(0),
  analysis: z.array(claimTemporalAnalysisSchema),
  model: z.string(),
  latencyMs: z.number().min(0),
});

export const analyzeFreshnessApiRequestSchema = z.object({
  body: z.object({
    verificationId: z.string().optional(),
    claims: z.array(z.any()).optional(),
    answerText: z.string().max(30000).optional(),
    topicHint: z.string().max(100).optional(),
    model: z.string().optional(),
  }).refine((data) => data.verificationId || (data.claims && data.claims.length > 0) || data.answerText, {
    message: 'Either "verificationId", "claims" array, or "answerText" must be provided',
    path: ['claims'],
  }),
});
