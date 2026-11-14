"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoringService = exports.ScoringService = void 0;
const scoring_engine_1 = require("./scoring.engine");
const risk_engine_1 = require("../risk/risk.engine");
const scoring_explainability_1 = require("./scoring.explainability");
const scoring_config_1 = require("./scoring.config");
const scoring_validation_1 = require("./scoring.validation");
const logger_1 = require("../../config/logger");
class ScoringService {
    config;
    constructor(config = scoring_config_1.DEFAULT_SCORING_CONFIG) {
        this.config = config;
    }
    getConfig() {
        return this.config;
    }
    /**
     * Evaluates a single factual claim across all 5 scoring factors and assigns risk level.
     */
    evaluateClaim(claim) {
        // 1. Calculate 5 individual factors
        const temporalRelevance = scoring_engine_1.scoringEngine.calculateTemporalRelevance(claim.timeSensitivity, claim.claimText);
        const evidenceRecency = scoring_engine_1.scoringEngine.calculateEvidenceRecency(claim.timeSensitivity, claim.evidence);
        const evidenceQuality = scoring_engine_1.scoringEngine.calculateEvidenceQuality(claim.evidence, claim.timeSensitivity, claim.status);
        const verificationOutcome = scoring_engine_1.scoringEngine.calculateVerificationOutcome(claim.status, claim.verdict);
        const uncertainty = scoring_engine_1.scoringEngine.calculateUncertainty(claim.evidence, claim.confidence, claim.status, claim.timeSensitivity);
        const factors = {
            temporalRelevance,
            evidenceRecency,
            evidenceQuality,
            verificationOutcome,
            uncertainty,
        };
        // 2. Compute final claim freshness score
        const freshnessScore = scoring_engine_1.scoringEngine.computeClaimScore(factors, claim.status, claim.verdict);
        // 3. Classify claim risk orthogonally from freshness
        const riskLevel = risk_engine_1.riskEngine.classifyClaimRisk(claim.status, claim.timeSensitivity, freshnessScore, claim.order);
        // 4. Synthesize natural language explainability
        const explainability = scoring_explainability_1.scoringExplainabilityService.generateClaimExplanation(claim, factors, freshnessScore, riskLevel);
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
    evaluateAnswer(claims) {
        const scoredClaims = claims.map((c) => this.evaluateClaim(c));
        // Calculate count distributions
        let supportedClaims = 0;
        let outdatedClaims = 0;
        let partiallySupportedClaims = 0;
        let conflictingClaims = 0;
        let unverifiedClaims = 0;
        let claimsNotChecked = 0;
        for (const sc of scoredClaims) {
            if (sc.verificationStatus === 'SUPPORTED')
                supportedClaims++;
            else if (sc.verificationStatus === 'OUTDATED')
                outdatedClaims++;
            else if (sc.verificationStatus === 'PARTIALLY_SUPPORTED')
                partiallySupportedClaims++;
            else if (sc.verificationStatus === 'CONFLICTING')
                conflictingClaims++;
            else if (sc.verificationStatus === 'UNVERIFIED')
                unverifiedClaims++;
            else if (sc.verificationStatus === 'NOT_CHECKED')
                claimsNotChecked++;
        }
        // 1. Overall Freshness Score (weighted aggregation)
        const overallFreshnessScore = scoring_engine_1.scoringEngine.computeOverallScore(scoredClaims.map((c) => ({
            freshnessScore: c.freshnessScore,
            timeSensitivity: c.timeSensitivity,
            status: c.verificationStatus,
            order: c.order,
        })));
        const freshnessInterpretation = scoring_engine_1.scoringEngine.interpretScore(overallFreshnessScore);
        // 2. Independent Risk Assessment
        const riskResult = risk_engine_1.riskEngine.classifyAnswerRisk({
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
        }
        else if (overallFreshnessScore >= 90) {
            overallExplanation = `All ${scoredClaims.length} assertions are grounded in authoritative, current evidence. Freshness score is ${overallFreshnessScore}/100.`;
        }
        else {
            overallExplanation = `Assertions are generally supported with a freshness score of ${overallFreshnessScore}/100, but include volatile elements requiring periodic monitoring.`;
        }
        const output = {
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
        const validated = scoring_validation_1.answerScoringOutputSchema.parse(output);
        logger_1.logger.info('Answer scoring evaluation complete', {
            overallFreshnessScore,
            overallRiskLevel: riskResult.riskLevel,
            freshnessInterpretation,
            totalClaims: scoredClaims.length,
            outdatedClaims,
        });
        return validated;
    }
}
exports.ScoringService = ScoringService;
exports.scoringService = new ScoringService();
//# sourceMappingURL=scoring.service.js.map