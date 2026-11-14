import { ScoringEngineConfig } from './scoring.config';
import { ClaimScoringInput, ScoringFactors, CanonicalFreshnessInterpretation } from './scoring.types';
export declare class ScoringEngine {
    private config;
    constructor(config?: ScoringEngineConfig);
    /**
     * Evaluates the inherent temporal stability/volatility of a claim (0 - 100).
     */
    calculateTemporalRelevance(timeSensitivity: 'STATIC' | 'SEMI_DYNAMIC' | 'HIGHLY_DYNAMIC', claimText: string): number;
    /**
     * Evaluates evidence recency relative to volatility (0 - 100).
     * Stable historical facts never decay.
     */
    calculateEvidenceRecency(timeSensitivity: 'STATIC' | 'SEMI_DYNAMIC' | 'HIGHLY_DYNAMIC', evidenceList: ClaimScoringInput['evidence']): number;
    /**
     * Evaluates evidence quality, authority tier, and corroboration (0 - 100).
     */
    calculateEvidenceQuality(evidenceList: ClaimScoringInput['evidence'], timeSensitivity?: 'STATIC' | 'SEMI_DYNAMIC' | 'HIGHLY_DYNAMIC', status?: string): number;
    /**
     * Evaluates verification cross-examination outcome (0 - 100).
     */
    calculateVerificationOutcome(status: ClaimScoringInput['status'], verdict: ClaimScoringInput['verdict']): number;
    /**
     * Evaluates certainty and completeness of evidence (0 - 100).
     */
    calculateUncertainty(evidenceList: ClaimScoringInput['evidence'], confidence: number, status: ClaimScoringInput['status'], timeSensitivity: 'STATIC' | 'SEMI_DYNAMIC' | 'HIGHLY_DYNAMIC'): number;
    /**
     * Computes the final claim freshness score from the 5 factors.
     */
    computeClaimScore(factors: ScoringFactors, status: ClaimScoringInput['status'], verdict: ClaimScoringInput['verdict']): number;
    /**
     * Interprets score against configurable canonical thresholds.
     */
    interpretScore(score: number): CanonicalFreshnessInterpretation;
    /**
     * Computes weighted aggregate freshness for the entire answer.
     */
    computeOverallScore(scoredClaims: Array<{
        freshnessScore: number;
        timeSensitivity: string;
        status: string;
        order: number;
    }>): number;
}
export declare const scoringEngine: ScoringEngine;
//# sourceMappingURL=scoring.engine.d.ts.map