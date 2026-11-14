import { RiskLevel, Verdict, TimeSensitivity } from '../utils/scoringFormula';
import { EvidenceItem, ScoredClaim } from '../types/verification.types';
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
export declare function scoreClaimsAndClassifyRisk(claims: ClaimScoringInput[]): ScoringResult;
//# sourceMappingURL=scoringService.d.ts.map