"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riskEngine = exports.RiskEngine = void 0;
class RiskEngine {
    /**
     * Evaluates claim-level risk (LOW, MODERATE, HIGH, CRITICAL).
     * Separate and orthogonal from pure freshness score.
     */
    classifyClaimRisk(status, timeSensitivity, freshnessScore, order) {
        const isOutdated = status === 'OUTDATED' || freshnessScore < 25;
        const isDynamic = timeSensitivity === 'HIGHLY_DYNAMIC';
        const isSemiDynamic = timeSensitivity === 'SEMI_DYNAMIC';
        const isConflicting = status === 'CONFLICTING';
        const isUnverified = status === 'UNVERIFIED';
        if (isOutdated && isDynamic) {
            return 'CRITICAL';
        }
        if (isOutdated) {
            return 'HIGH';
        }
        if (isConflicting) {
            return 'MODERATE';
        }
        if (isDynamic && status === 'SUPPORTED') {
            return 'MODERATE'; // Safe today, but high monitoring risk
        }
        if (isUnverified) {
            return 'MODERATE'; // Epistemic uncertainty, not automatically false
        }
        if (isSemiDynamic && status === 'PARTIALLY_SUPPORTED') {
            return 'MODERATE';
        }
        return 'LOW';
    }
    /**
     * Classifies overall answer risk and generates an explainable rationale.
     */
    classifyAnswerRisk(input) {
        const { overallFreshnessScore, totalClaims, outdatedCount, conflictingCount, unverifiedCount, claims, } = input;
        const unverifiedRatio = totalClaims > 0 ? unverifiedCount / totalClaims : 0;
        const hasCriticalClaim = claims.some((c) => c.status === 'OUTDATED' && c.timeSensitivity === 'HIGHLY_DYNAMIC');
        const hasOutdatedClaim = outdatedCount > 0;
        const hasConflicts = conflictingCount > 0;
        const hasHighVolatility = claims.some((c) => c.timeSensitivity === 'HIGHLY_DYNAMIC');
        let riskLevel = 'LOW';
        let explanation = '';
        if (hasCriticalClaim || (hasOutdatedClaim && outdatedCount >= 2)) {
            riskLevel = 'CRITICAL';
            explanation = `Critical reliability risk: Answer contains ${outdatedCount} outdated assertion(s) in highly time-sensitive domains that directly contradict current authoritative facts. Hallucination or obsolescence risk is severe.`;
        }
        else if (hasOutdatedClaim || overallFreshnessScore < 50) {
            riskLevel = 'HIGH';
            explanation = `High reliability risk: ${outdatedCount} assertion(s) have been superseded by newer reality. Factual grounding requires revision before distribution.`;
        }
        else if (hasConflicts) {
            riskLevel = 'MODERATE';
            explanation = `Moderate reliability risk: Found ${conflictingCount} assertion(s) with conflicting evidence across independent sources. Disagreement stems from differing scopes or reporting baselines.`;
        }
        else if (unverifiedRatio > 0.5) {
            riskLevel = 'MODERATE';
            explanation = `Moderate reliability risk: ${Math.round(unverifiedRatio * 100)}% of claims lack sufficient public evidence to verify. Unverified claims are not assumed false, but require human review.`;
        }
        else if (hasHighVolatility) {
            riskLevel = 'MODERATE';
            explanation = `Moderate reliability risk: All assertions currently verify as fresh, but contain highly volatile data points that require active monitoring.`;
        }
        else {
            riskLevel = 'LOW';
            explanation = `Low reliability risk: All ${totalClaims} factual assertions are confirmed fresh and supported by authoritative, stable documentation with negligible drift exposure.`;
        }
        return {
            riskLevel,
            explanation,
            riskFactors: {
                hasSevereOutdatedAssertions: hasCriticalClaim,
                hasMultiSourceConflicts: hasConflicts,
                hasHighVolatilityDecayRisk: hasHighVolatility,
                unverifiedRatio,
            },
        };
    }
}
exports.RiskEngine = RiskEngine;
exports.riskEngine = new RiskEngine();
//# sourceMappingURL=risk.engine.js.map