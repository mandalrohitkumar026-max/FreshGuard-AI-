import { ClaimRiskLevel } from '../scoring/scoring.types';
export interface RiskEvaluationInput {
    overallFreshnessScore: number;
    totalClaims: number;
    outdatedCount: number;
    conflictingCount: number;
    unverifiedCount: number;
    partiallySupportedCount: number;
    supportedCount: number;
    claims: Array<{
        claimText: string;
        status: string;
        timeSensitivity: string;
        freshnessScore: number;
        order: number;
    }>;
}
export interface RiskEvaluationResult {
    riskLevel: ClaimRiskLevel;
    explanation: string;
    riskFactors: {
        hasSevereOutdatedAssertions: boolean;
        hasMultiSourceConflicts: boolean;
        hasHighVolatilityDecayRisk: boolean;
        unverifiedRatio: number;
    };
}
export declare class RiskEngine {
    /**
     * Evaluates claim-level risk (LOW, MODERATE, HIGH, CRITICAL).
     * Separate and orthogonal from pure freshness score.
     */
    classifyClaimRisk(status: string, timeSensitivity: string, freshnessScore: number, order: number): ClaimRiskLevel;
    /**
     * Classifies overall answer risk and generates an explainable rationale.
     */
    classifyAnswerRisk(input: RiskEvaluationInput): RiskEvaluationResult;
}
export declare const riskEngine: RiskEngine;
//# sourceMappingURL=risk.engine.d.ts.map