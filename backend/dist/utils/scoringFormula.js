"use strict";
/**
 * Deterministic freshness scoring formula.
 * All functions are pure — same inputs always produce same output.
 * Independently testable without any external dependencies.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verdictWeight = verdictWeight;
exports.evidenceAgeWeight = evidenceAgeWeight;
exports.authorityWeight = authorityWeight;
exports.computeClaimFreshnessScore = computeClaimFreshnessScore;
exports.computeAggregateScore = computeAggregateScore;
exports.classifyRisk = classifyRisk;
/** Map verdict to a 0–1 weight */
function verdictWeight(verdict) {
    const weights = {
        CONFIRMS: 1.0,
        PARTIALLY_CONTRADICTS: 0.5,
        CONTRADICTS: 0.0,
        INSUFFICIENT: 0.3,
    };
    return weights[verdict];
}
/** Map evidence age in days to a 0–1 weight */
function evidenceAgeWeight(ageInDays) {
    if (ageInDays === null)
        return 0.2; // unknown age — penalised slightly
    if (ageInDays <= 7)
        return 1.0;
    if (ageInDays <= 30)
        return 0.8;
    if (ageInDays <= 90)
        return 0.6;
    if (ageInDays <= 365)
        return 0.3;
    return 0.0;
}
/** Map source authority tier to a 0–1 weight */
function authorityWeight(tier) {
    const weights = {
        HIGH: 1.0,
        MEDIUM: 0.7,
        LOW: 0.4,
        UNKNOWN: 0.2,
    };
    return weights[tier];
}
/**
 * Compute per-claim freshness score (0–100).
 *
 * Score = (verdictWeight × 60) + (evidenceAgeWeight × 25) + (authorityWeight × 15)
 */
function computeClaimFreshnessScore(inputs) {
    const vw = verdictWeight(inputs.verdict);
    const aw = evidenceAgeWeight(inputs.bestEvidenceAgeInDays);
    const sw = authorityWeight(inputs.bestAuthorityTier);
    const raw = vw * 60 + aw * 25 + sw * 15;
    // If verdict is CONTRADICTS, cap at 40 regardless of source quality
    if (inputs.verdict === 'CONTRADICTS') {
        return Math.min(raw, 40);
    }
    // If conflicting evidence (PARTIALLY), cap at 50
    if (inputs.verdict === 'PARTIALLY_CONTRADICTS') {
        return Math.min(raw, 65);
    }
    return Math.round(Math.min(100, Math.max(0, raw)));
}
/** Time-sensitivity multipliers for weighted average */
const SENSITIVITY_WEIGHTS = {
    STATIC: 1,
    SEMI_DYNAMIC: 1.5,
    HIGHLY_DYNAMIC: 3,
};
/**
 * Compute the weighted aggregate freshness score for all claims.
 * Highly dynamic claims contribute 3× more to the aggregate.
 */
function computeAggregateScore(inputs) {
    if (inputs.claims.length === 0)
        return 100;
    let weightedSum = 0;
    let totalWeight = 0;
    for (const claim of inputs.claims) {
        const w = SENSITIVITY_WEIGHTS[claim.timeSensitivity];
        weightedSum += w * claim.freshnessScore;
        totalWeight += w;
    }
    return Math.round(weightedSum / totalWeight);
}
/**
 * Classify overall answer risk from aggregate score and claim stats.
 */
function classifyRisk(aggregateScore, totalClaims, insufficientClaims) {
    // If > 50% of claims have insufficient evidence → UNVERIFIABLE
    if (totalClaims > 0 && insufficientClaims / totalClaims > 0.5) {
        return 'UNVERIFIABLE';
    }
    if (aggregateScore >= 80)
        return 'FRESH';
    if (aggregateScore >= 60)
        return 'STALE';
    return 'OUTDATED';
}
//# sourceMappingURL=scoringFormula.js.map