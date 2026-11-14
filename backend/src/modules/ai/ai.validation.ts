import { z } from 'zod';

// ── Model Output Validation Schemas ────────────────────────────────────────

export const claimItemSchema = z.object({
  claimText: z.string().min(3, 'Claim text must be at least 3 characters'),
  category: z.string().default('general'),
  timeSensitive: z.boolean().default(false),
  reason: z.string().default(''),
});

export const claimExtractionResponseSchema = z.object({
  claims: z.array(claimItemSchema).min(1, 'At least one claim must be extracted'),
});

export const timeSensitivityItemSchema = z.object({
  claimText: z.string().min(1),
  timeSensitivity: z.enum(['STATIC', 'SEMI_DYNAMIC', 'HIGHLY_DYNAMIC']),
  reason: z.string().default(''),
  changeLikelihood: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('LOW'),
});

export const timeSensitivityResponseSchema = z.object({
  classifications: z.array(timeSensitivityItemSchema),
});

export const evidenceAnalysisResponseSchema = z.object({
  verdict: z.enum(['CONFIRMS', 'CONTRADICTS', 'PARTIALLY_CONTRADICTS', 'INSUFFICIENT']),
  confidence: z.number().min(0).max(1),
  supportingStatements: z.array(z.string()).default([]),
  contradictions: z.array(z.string()).default([]),
  explanation: z.string().min(1, 'Explanation is required'),
});

export const correctionResponseSchema = z.object({
  hasModifications: z.boolean().default(true),
  correctedAnswer: z.string().min(1),
  changeExplanation: z.string().default(''),
  confidence: z.number().min(0).max(1).default(1),
});

// ── HTTP API Request Validation Schemas ────────────────────────────────────

export const extractClaimsRequestSchema = z.object({
  body: z.object({
    answerText: z.string().min(10, 'Answer text must be at least 10 characters').max(15000),
    topicHint: z.string().max(100).optional(),
    model: z.string().optional(),
  }),
});

export const analyzeClaimsRequestSchema = z.object({
  body: z.object({
    claims: z.array(z.string().min(3)).min(1, 'At least one claim is required'),
    model: z.string().optional(),
  }),
});

export const analyzeEvidenceRequestSchema = z.object({
  body: z.object({
    claimText: z.string().min(3, 'Claim text is required'),
    evidence: z.array(
      z.object({
        title: z.string().optional(),
        url: z.string().optional(),
        content: z.string().min(1, 'Evidence content is required'),
        domain: z.string().optional(),
        publishedDate: z.string().optional(),
      })
    ).min(1, 'At least one evidence item is required'),
    model: z.string().optional(),
  }),
});

export const generateCorrectionRequestSchema = z.object({
  body: z.object({
    originalAnswer: z.string().min(10, 'Original answer is required'),
    claims: z.array(
      z.object({
        claimText: z.string(),
        verdict: z.string(),
        explanation: z.string().optional(),
        evidence: z.array(z.any()).optional(),
      })
    ).min(1, 'At least one verified claim is required'),
    model: z.string().optional(),
  }),
});
