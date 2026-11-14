/**
 * Deterministic freshness scoring formula.
 * All functions are pure — same inputs always produce same output.
 * Independently testable without any external dependencies.
 */
export type Verdict = 'CONFIRMS' | 'CONTRADICTS' | 'PARTIALLY_CONTRADICTS' | 'INSUFFICIENT';
export type AuthorityTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
export type TimeSensitivity = 'STATIC' | 'SEMI_DYNAMIC' | 'HIGHLY_DYNAMIC';
/** Map verdict to a 0–1 weight */
export declare function verdictWeight(verdict: Verdict): number;
/** Map evidence age in days to a 0–1 weight */
export declare function evidenceAgeWeight(ageInDays: number | null): number;
/** Map source authority tier to a 0–1 weight */
export declare function authorityWeight(tier: AuthorityTier): number;
export interface ClaimScoreInputs {
    verdict: Verdict;
    bestEvidenceAgeInDays: number | null;
    bestAuthorityTier: AuthorityTier;
}
/**
 * Compute per-claim freshness score (0–100).
 *
 * Score = (verdictWeight × 60) + (evidenceAgeWeight × 25) + (authorityWeight × 15)
 */
export declare function computeClaimFreshnessScore(inputs: ClaimScoreInputs): number;
export interface AggregateScoreInputs {
    claims: Array<{
        timeSensitivity: TimeSensitivity;
        freshnessScore: number;
        verdict: Verdict;
    }>;
}
/**
 * Compute the weighted aggregate freshness score for all claims.
 * Highly dynamic claims contribute 3× more to the aggregate.
 */
export declare function computeAggregateScore(inputs: AggregateScoreInputs): number;
export type RiskLevel = 'FRESH' | 'STALE' | 'OUTDATED' | 'UNVERIFIABLE';
/**
 * Classify overall answer risk from aggregate score and claim stats.
 */
export declare function classifyRisk(aggregateScore: number, totalClaims: number, insufficientClaims: number): RiskLevel;
//# sourceMappingURL=scoringFormula.d.ts.map