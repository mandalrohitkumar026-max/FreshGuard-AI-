"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoringExplainabilityService = exports.ScoringExplainabilityService = void 0;
class ScoringExplainabilityService {
    generateClaimExplanation(claim, factors, score, riskLevel) {
        const positive = [];
        const negative = [];
        // Factor 1: Temporal
        if (factors.temporalRelevance === 100) {
            positive.push('Classified as a permanent historical/scientific invariant with non-decaying ground truth.');
        }
        else if (factors.temporalRelevance < 60) {
            negative.push('High temporal volatility; underlying facts are fluid and change frequently.');
        }
        // Factor 2: Recency
        if (factors.evidenceRecency >= 90) {
            positive.push('Supporting evidence was published recently within the active currency window.');
        }
        else if (factors.evidenceRecency <= 60 && claim.timeSensitivity !== 'STATIC') {
            negative.push('Evidence publication date is aging or unlisted relative to the topic volatility.');
        }
        // Factor 3: Quality & Corroboration
        if (factors.evidenceQuality >= 80) {
            positive.push('Corroborated by high-authority primary registries or official documentation.');
        }
        else if (factors.evidenceQuality < 60) {
            negative.push('Limited to secondary reporting or lacks independent cross-domain corroboration.');
        }
        // Factor 4: Verification Outcome
        if (factors.verificationOutcome === 100) {
            positive.push('Explicitly confirmed by live authoritative web documentation.');
        }
        else if (factors.verificationOutcome === 0) {
            negative.push('Directly contradicted by newer authoritative evidence releases.');
        }
        else if (factors.verificationOutcome === 50) {
            negative.push('Partially supported; contains minor outdated details alongside accurate elements.');
        }
        else if (factors.verificationOutcome === 30) {
            negative.push('Credible independent sources conflict regarding the current state.');
        }
        else if (factors.verificationOutcome === 40) {
            negative.push('Insufficient reliable evidence on the public web to definitively confirm or refute.');
        }
        // Factor 5: Uncertainty
        if (factors.uncertainty < 60) {
            negative.push('Epistemic uncertainty elevated due to missing publication timestamps or ambiguous queries.');
        }
        // Compose primary explanation sentence
        let explanation = `The claim received a freshness score of ${score} `;
        if (score >= 90) {
            explanation += `because authoritative evidence confirms the assertion and information remains current and stable.`;
        }
        else if (score >= 75) {
            explanation += `because recent evidence supports the assertion, though ongoing temporal monitoring is advised.`;
        }
        else if (factors.verificationOutcome === 0) {
            explanation += `because the assertion was superseded by newer reality and is contradicted by official records.`;
        }
        else if (factors.verificationOutcome === 30) {
            explanation += `because credible authoritative sources directly disagree on the current ground truth.`;
        }
        else if (factors.verificationOutcome === 40) {
            explanation += `because public evidence is insufficient to verify the claim with high certainty.`;
        }
        else {
            explanation += `because evidence recency has aged relative to the domain's rapid pace of change.`;
        }
        // Action recommendation
        let recommendedAction = 'No immediate action required.';
        if (riskLevel === 'CRITICAL') {
            recommendedAction = 'Replace or correct assertion immediately before publishing; information is verified outdated.';
        }
        else if (riskLevel === 'HIGH') {
            recommendedAction = 'Review assertion against live official records to incorporate newer updates.';
        }
        else if (riskLevel === 'MODERATE' && claim.status === 'CONFLICTING') {
            recommendedAction = 'Clarify context, reporting standard, or regional scope to resolve source divergence.';
        }
        else if (riskLevel === 'MODERATE' && claim.status === 'UNVERIFIED') {
            recommendedAction = 'Conduct manual verification or provide more specific reference queries.';
        }
        else if (claim.timeSensitivity === 'HIGHLY_DYNAMIC') {
            recommendedAction = 'Activate Freshness Watch to monitor for automated week-over-week drift.';
        }
        return {
            explanation,
            recommendedAction,
            positiveContributions: positive,
            negativeContributions: negative,
        };
    }
}
exports.ScoringExplainabilityService = ScoringExplainabilityService;
exports.scoringExplainabilityService = new ScoringExplainabilityService();
//# sourceMappingURL=scoring.explainability.js.map