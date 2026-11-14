import { z } from 'zod';

export const claimTypeSchema = z.enum([
  'FACTUAL',
  'OPINION',
  'PREDICTION',
  'RECOMMENDATION',
  'HYPOTHETICAL',
  'QUESTION',
  'INSTRUCTION',
]);

export const claimCategorySchema = z.enum([
  'TECHNOLOGY',
  'BUSINESS',
  'FINANCE',
  'GOVERNMENT',
  'EDUCATION',
  'HISTORY',
  'SCIENCE',
  'GENERAL',
]);

export const entityTypeSchema = z.enum([
  'PERSON',
  'ORGANIZATION',
  'COMPANY',
  'PRODUCT',
  'SOFTWARE',
  'TECHNOLOGY',
  'LOCATION',
  'DATE',
  'CURRENCY',
  'NUMERICAL_VALUE',
  'REGULATION',
  'OTHER',
]);

export const extractedEntitySchema = z.object({
  text: z.string().min(1, 'Entity text cannot be empty'),
  type: entityTypeSchema,
});

export const numericalValueSchema = z.object({
  value: z.string().min(1, 'Numerical value cannot be empty'),
  unit: z.string().optional(),
});

export const textReferenceSchema = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(0),
});

export const extractedClaimSchema = z.object({
  claimId: z.string().min(1),
  claimText: z.string().min(2, 'Claim text must be at least 2 characters'),
  claimType: claimTypeSchema.default('FACTUAL'),
  category: claimCategorySchema.default('GENERAL'),
  entities: z.array(extractedEntitySchema).default([]),
  dates: z.array(z.string()).default([]),
  numericalValues: z.array(numericalValueSchema).default([]),
  context: z.string().default(''),
  originalTextReference: textReferenceSchema.default({ start: 0, end: 0 }),
  extractionConfidence: z.number().min(0).max(1).default(0.9),
  dependencies: z.array(z.string()).optional(),
  isDuplicate: z.boolean().optional(),
  duplicateOf: z.string().optional(),
  order: z.number().optional(),
});

export const rawModelClaimOutputSchema = z.object({
  claims: z.array(
    z.object({
      claimText: z.string().min(1),
      claimType: z.string().optional(),
      category: z.string().optional(),
      entities: z.array(z.any()).optional(),
      dates: z.array(z.string()).optional(),
      numericalValues: z.array(z.any()).optional(),
      context: z.string().optional(),
      extractionConfidence: z.number().optional(),
      dependencies: z.array(z.string()).optional(),
    }),
  ),
});

export const claimExtractionApiResponseSchema = z.object({
  verificationId: z.string(),
  totalClaims: z.number().min(0),
  factualClaimsCount: z.number().min(0),
  nonFactualClaimsCount: z.number().min(0),
  claims: z.array(extractedClaimSchema),
  originalText: z.string(),
  model: z.string(),
  latencyMs: z.number().min(0),
});

export const extractClaimsApiRequestSchema = z.object({
  body: z.object({
    verificationId: z.string().optional(),
    answer: z.string().min(1, 'Answer text is required and cannot be empty').max(30000, 'Answer exceeds maximum 30,000 characters limit'),
    topicHint: z.string().max(100).optional(),
    model: z.string().optional(),
  }),
});
