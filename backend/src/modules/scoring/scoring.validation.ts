import { z } from 'zod';

export const scoringFactorsSchema = z.object({
  temporalRelevance: z.number().min(0).max(100),
  evidenceRecency: z.number().min(0).max(100),
  evidenceQuality: z.number().min(0).max(100),
  verificationOutcome: z.number().min(0).max(100),
  uncertainty: z.number().min(0).max(100),
});

export const claimScoringOutputSchema = z.object({
  claimId: z.string(),
  order: z.number(),
  claimText: z.string(),
  freshnessScore: z.number().min(0).max(100),
  riskLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
  timeSensitivity: z.string(),
  verificationStatus: z.enum([
    'SUPPORTED',
    'OUTDATED',
    'PARTIALLY_SUPPORTED',
    'CONFLICTING',
    'UNVERIFIED',
    'NOT_CHECKED',
  ]),
  evidenceConfidence: z.number().min(0).max(1),
  explanation: z.string(),
  factors: scoringFactorsSchema,
  recommendedAction: z.string(),
  positiveContributions: z.array(z.string()),
  negativeContributions: z.array(z.string()),
});

export const answerScoringOutputSchema = z.object({
  overallFreshnessScore: z.number().min(0).max(100),
  overallRiskLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
  freshnessInterpretation: z.enum([
    'VERY_FRESH',
    'FRESH',
    'NEEDS_REVIEW',
    'POTENTIALLY_OUTDATED',
    'SEVERELY_OUTDATED',
  ]),
  riskExplanation: z.string(),
  explanation: z.string(),
  totalClaims: z.number().min(0),
  supportedClaims: z.number().min(0),
  outdatedClaims: z.number().min(0),
  partiallySupportedClaims: z.number().min(0),
  conflictingClaims: z.number().min(0),
  unverifiedClaims: z.number().min(0),
  claimsNotChecked: z.number().min(0),
  claims: z.array(claimScoringOutputSchema),
  scoringConfigVersion: z.string(),
  evaluatedAt: z.string(),
});
