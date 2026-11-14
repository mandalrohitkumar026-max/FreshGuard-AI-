import { scoringEngine } from './scoring.engine';
import { riskEngine } from '../risk/risk.engine';
import { scoringExplainabilityService } from './scoring.explainability';
import { DEFAULT_SCORING_CONFIG, ScoringEngineConfig } from './scoring.config';
import {
  ClaimScoringInput,
  ClaimScoringOutput,
  AnswerScoringOutput,
  ScoringFactors,
} from './scoring.types';
import { answerScoringOutputSchema } from './scoring.validation';
import { logger } from '../../config/logger';

export class ScoringService {
  private config: ScoringEngineConfig;

  constructor(config: ScoringEngineConfig = DEFAULT_SCORING_CONFIG) {
    this.config = config;
  }

  getConfig(): ScoringEngineConfig {
    return this.config;
  }

  /**
   * Evaluates a single factual claim across all 5 scoring factors and assigns risk level.
   */
  evaluateClaim(claim: ClaimScoringInput): ClaimScoringOutput {
    // 1. Calculate 5 individual factors
    const temporalRelevance = scoringEngine.calculateTemporalRelevance(
      claim.timeSensitivity,
      claim.claimText,
    );

    const evidenceRecency = scoringEngine.calculateEvidenceRecency(
      claim.timeSensitivity,
      claim.evidence,
    );

    const evidenceQuality = scoringEngine.calculateEvidenceQuality(
      claim.evidence,
      claim.timeSensitivity,
      claim.status,
    );

    const verificationOutcome = scoringEngine.calculateVerificationOutcome(
      claim.status,
      claim.verdict,
    );

    const uncertainty = scoringEngine.calculateUncertainty(
      claim.evidence,
      claim.confidence,
      claim.status,
      claim.timeSensitivity,
    );

    const factors: ScoringFactors = {
      temporalRelevance,
      evidenceRecency,
      evidenceQuality,
      verificationOutcome,
      uncertainty,
    };

    // 2. Compute final claim freshness score
    const freshnessScore = scoringEngine.computeClaimScore(factors, claim.status, claim.verdict);

    // 3. Classify claim risk orthogonally from freshness
    const riskLevel = riskEngine.classifyClaimRisk(
      claim.status,
      claim.timeSensitivity,
      freshnessScore,
      claim.order,
    );

    // 4. Synthesize natural language explainability
    const explainability = scoringExplainabilityService.generateClaimExplanation(
      claim,
      factors,
      freshnessScore,
      riskLevel,
    );

    return {
      claimId: claim.claimId,
      order: claim.order,
      claimText: claim.claimText,
      freshnessScore,
      riskLevel,
      timeSensitivity: claim.timeSensitivity,
      verificationStatus: claim.status,
      evidenceConfidence: Math.max(0.1, Math.min(1.0, factors.uncertainty / 100)),
      explanation: explainability.explanation,
      factors,
      recommendedAction: explainability.recommendedAction,
      positiveContributions: explainability.positiveContributions,
      negativeContributions: explainability.negativeContributions,
    };
  }

  /**
   * Evaluates an entire AI answer by aggregating individual claim scores and triaging overall risk.
   */
  evaluateAnswer(claims: ClaimScoringInput[]): AnswerScoringOutput {
    const scoredClaims: ClaimScoringOutput[] = claims.map((c) => this.evaluateClaim(c));

    // Calculate count distributions
    let supportedClaims = 0;
    let outdatedClaims = 0;
    let partiallySupportedClaims = 0;
    let conflictingClaims = 0;
    let unverifiedClaims = 0;
    let claimsNotChecked = 0;

    for (const sc of scoredClaims) {
      if (sc.verificationStatus === 'SUPPORTED') supportedClaims++;
      else if (sc.verificationStatus === 'OUTDATED') outdatedClaims++;
      else if (sc.verificationStatus === 'PARTIALLY_SUPPORTED') partiallySupportedClaims++;
      else if (sc.verificationStatus === 'CONFLICTING') conflictingClaims++;
      else if (sc.verificationStatus === 'UNVERIFIED') unverifiedClaims++;
      else if (sc.verificationStatus === 'NOT_CHECKED') claimsNotChecked++;
    }

    // 1. Overall Freshness Score (weighted aggregation)
    const overallFreshnessScore = scoringEngine.computeOverallScore(
      scoredClaims.map((c) => ({
        freshnessScore: c.freshnessScore,
        timeSensitivity: c.timeSensitivity,
        status: c.verificationStatus,
        order: c.order,
      })),
    );

    const freshnessInterpretation = scoringEngine.interpretScore(overallFreshnessScore);

    // 2. Independent Risk Assessment
    const riskResult = riskEngine.classifyAnswerRisk({
      overallFreshnessScore,
      totalClaims: scoredClaims.length,
      outdatedCount: outdatedClaims,
      conflictingCount: conflictingClaims,
      unverifiedCount: unverifiedClaims,
      partiallySupportedCount: partiallySupportedClaims,
      supportedCount: supportedClaims,
      claims: scoredClaims.map((c) => ({
        claimText: c.claimText,
        status: c.verificationStatus,
        timeSensitivity: c.timeSensitivity,
        freshnessScore: c.freshnessScore,
        order: c.order,
      })),
    });

    let overallExplanation = '';
    if (outdatedClaims > 0) {
      overallExplanation = `Answer contains ${outdatedClaims} verified outdated assertion(s) superseded by current reality. Freshness score is ${overallFreshnessScore}/100.`;
    } else if (overallFreshnessScore >= 90) {
      overallExplanation = `All ${scoredClaims.length} assertions are grounded in authoritative, current evidence. Freshness score is ${overallFreshnessScore}/100.`;
    } else {
      overallExplanation = `Assertions are generally supported with a freshness score of ${overallFreshnessScore}/100, but include volatile elements requiring periodic monitoring.`;
    }

    const output: AnswerScoringOutput = {
      overallFreshnessScore,
      overallRiskLevel: riskResult.riskLevel,
      freshnessInterpretation,
      riskExplanation: riskResult.explanation,
      explanation: overallExplanation,
      totalClaims: scoredClaims.length,
      supportedClaims,
      outdatedClaims,
      partiallySupportedClaims,
      conflictingClaims,
      unverifiedClaims,
      claimsNotChecked,
      claims: scoredClaims,
      scoringConfigVersion: this.config.version,
      evaluatedAt: new Date().toISOString(),
    };

    // Validate with Zod
    const validated = answerScoringOutputSchema.parse(output);

    logger.info('Answer scoring evaluation complete', {
      overallFreshnessScore,
      overallRiskLevel: riskResult.riskLevel,
      freshnessInterpretation,
      totalClaims: scoredClaims.length,
      outdatedClaims,
    });

    return validated;
  }
}

export const scoringService = new ScoringService();
