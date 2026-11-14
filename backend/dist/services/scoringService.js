"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreClaimsAndClassifyRisk = scoreClaimsAndClassifyRisk;
const scoringFormula_1 = require("../utils/scoringFormula");
const evidenceValidatorService_1 = require("./evidenceValidatorService");
const logger_1 = require("../utils/logger");
/**
 * Scoring Service (Pipeline Stages 9 & 10)
 *
 * Computes per-claim freshness scores and the aggregate session score.
 * All logic is deterministic — given same inputs, always same output.
 * Completely independent of LLMs.
 */
function scoreClaimsAndClassifyRisk(claims) {
    const scoredClaims = claims.map((claim) => {
        // STATIC claims always score 100 — they don't need evidence
        if (claim.timeSensitivity === 'STATIC') {
            return {
                ...claim,
                freshnessScore: 100,
            };
        }
        const best = (0, evidenceValidatorService_1.findBestEvidence)(claim.evidence);
        const score = (0, scoringFormula_1.computeClaimFreshnessScore)({
            verdict: claim.verdict,
            bestEvidenceAgeInDays: best?.ageInDays ?? null,
            bestAuthorityTier: (best?.authorityTier ?? 'UNKNOWN'),
        });
        return {
            ...claim,
            freshnessScore: score,
        };
    });
    const aggregateFreshnessScore = (0, scoringFormula_1.computeAggregateScore)({
        claims: scoredClaims.map((c) => ({
            timeSensitivity: c.timeSensitivity,
            freshnessScore: c.freshnessScore,
            verdict: c.verdict,
        })),
    });
    const insufficientClaims = scoredClaims.filter((c) => c.verdict === 'INSUFFICIENT').length;
    const riskLevel = (0, scoringFormula_1.classifyRisk)(aggregateFreshnessScore, scoredClaims.length, insufficientClaims);
    const stats = {
        totalClaims: scoredClaims.length,
        staticClaims: scoredClaims.filter((c) => c.timeSensitivity === 'STATIC').length,
        semiDynamicClaims: scoredClaims.filter((c) => c.timeSensitivity === 'SEMI_DYNAMIC').length,
        highlyDynamicClaims: scoredClaims.filter((c) => c.timeSensitivity === 'HIGHLY_DYNAMIC').length,
        staleClaims: scoredClaims.filter((c) => c.freshnessScore < 80 && c.timeSensitivity !== 'STATIC').length,
        unverifiableClaims: insufficientClaims,
    };
    logger_1.logger.info('Scoring complete', {
        aggregateFreshnessScore,
        riskLevel,
        ...stats,
    });
    return { scoredClaims, aggregateFreshnessScore, riskLevel, stats };
}
//# sourceMappingURL=scoringService.js.map