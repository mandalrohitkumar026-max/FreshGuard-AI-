import {
  computeClaimFreshnessScore,
  computeAggregateScore,
  classifyRisk,
  RiskLevel,
  Verdict,
  TimeSensitivity,
  AuthorityTier,
} from '../utils/scoringFormula';
import { EvidenceItem, ScoredClaim } from '../types/verification.types';
import { findBestEvidence } from './evidenceValidatorService';
import { logger } from '../utils/logger';

export interface ClaimScoringInput {
  claimText: string;
  order: number;
  timeSensitivity: TimeSensitivity;
  searchQuery: string | null;
  verdict: Verdict;
  confidence: number;
  explanation: string;
  evidence: EvidenceItem[];
}

export interface ScoringResult {
  scoredClaims: ScoredClaim[];
  aggregateFreshnessScore: number;
  riskLevel: RiskLevel;
  stats: {
    totalClaims: number;
    staticClaims: number;
    semiDynamicClaims: number;
    highlyDynamicClaims: number;
    staleClaims: number;
    unverifiableClaims: number;
  };
}

/**
 * Scoring Service (Pipeline Stages 9 & 10)
 *
 * Computes per-claim freshness scores and the aggregate session score.
 * All logic is deterministic — given same inputs, always same output.
 * Completely independent of LLMs.
 */
export function scoreClaimsAndClassifyRisk(claims: ClaimScoringInput[]): ScoringResult {
  const scoredClaims: ScoredClaim[] = claims.map((claim) => {
    // STATIC claims always score 100 — they don't need evidence
    if (claim.timeSensitivity === 'STATIC') {
      return {
        ...claim,
        freshnessScore: 100,
      };
    }

    const best = findBestEvidence(claim.evidence);

    const score = computeClaimFreshnessScore({
      verdict: claim.verdict,
      bestEvidenceAgeInDays: best?.ageInDays ?? null,
      bestAuthorityTier: (best?.authorityTier ?? 'UNKNOWN') as AuthorityTier,
    });

    return {
      ...claim,
      freshnessScore: score,
    };
  });

  const aggregateFreshnessScore = computeAggregateScore({
    claims: scoredClaims.map((c) => ({
      timeSensitivity: c.timeSensitivity,
      freshnessScore: c.freshnessScore,
      verdict: c.verdict,
    })),
  });

  const insufficientClaims = scoredClaims.filter(
    (c) => c.verdict === 'INSUFFICIENT',
  ).length;

  const riskLevel = classifyRisk(
    aggregateFreshnessScore,
    scoredClaims.length,
    insufficientClaims,
  );

  const stats = {
    totalClaims: scoredClaims.length,
    staticClaims: scoredClaims.filter((c) => c.timeSensitivity === 'STATIC').length,
    semiDynamicClaims: scoredClaims.filter((c) => c.timeSensitivity === 'SEMI_DYNAMIC').length,
    highlyDynamicClaims: scoredClaims.filter((c) => c.timeSensitivity === 'HIGHLY_DYNAMIC').length,
    staleClaims: scoredClaims.filter((c) => c.freshnessScore < 80 && c.timeSensitivity !== 'STATIC').length,
    unverifiableClaims: insufficientClaims,
  };

  logger.info('Scoring complete', {
    aggregateFreshnessScore,
    riskLevel,
    ...stats,
  });

  return { scoredClaims, aggregateFreshnessScore, riskLevel, stats };
}
