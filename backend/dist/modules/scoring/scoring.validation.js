"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.answerScoringOutputSchema = exports.claimScoringOutputSchema = exports.scoringFactorsSchema = void 0;
const zod_1 = require("zod");
exports.scoringFactorsSchema = zod_1.z.object({
    temporalRelevance: zod_1.z.number().min(0).max(100),
    evidenceRecency: zod_1.z.number().min(0).max(100),
    evidenceQuality: zod_1.z.number().min(0).max(100),
    verificationOutcome: zod_1.z.number().min(0).max(100),
    uncertainty: zod_1.z.number().min(0).max(100),
});
exports.claimScoringOutputSchema = zod_1.z.object({
    claimId: zod_1.z.string(),
    order: zod_1.z.number(),
    claimText: zod_1.z.string(),
    freshnessScore: zod_1.z.number().min(0).max(100),
    riskLevel: zod_1.z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
    timeSensitivity: zod_1.z.string(),
    verificationStatus: zod_1.z.enum([
        'SUPPORTED',
        'OUTDATED',
        'PARTIALLY_SUPPORTED',
        'CONFLICTING',
        'UNVERIFIED',
        'NOT_CHECKED',
    ]),
    evidenceConfidence: zod_1.z.number().min(0).max(1),
    explanation: zod_1.z.string(),
    factors: exports.scoringFactorsSchema,
    recommendedAction: zod_1.z.string(),
    positiveContributions: zod_1.z.array(zod_1.z.string()),
    negativeContributions: zod_1.z.array(zod_1.z.string()),
});
exports.answerScoringOutputSchema = zod_1.z.object({
    overallFreshnessScore: zod_1.z.number().min(0).max(100),
    overallRiskLevel: zod_1.z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
    freshnessInterpretation: zod_1.z.enum([
        'VERY_FRESH',
        'FRESH',
        'NEEDS_REVIEW',
        'POTENTIALLY_OUTDATED',
        'SEVERELY_OUTDATED',
    ]),
    riskExplanation: zod_1.z.string(),
    explanation: zod_1.z.string(),
    totalClaims: zod_1.z.number().min(0),
    supportedClaims: zod_1.z.number().min(0),
    outdatedClaims: zod_1.z.number().min(0),
    partiallySupportedClaims: zod_1.z.number().min(0),
    conflictingClaims: zod_1.z.number().min(0),
    unverifiedClaims: zod_1.z.number().min(0),
    claimsNotChecked: zod_1.z.number().min(0),
    claims: zod_1.z.array(exports.claimScoringOutputSchema),
    scoringConfigVersion: zod_1.z.string(),
    evaluatedAt: zod_1.z.string(),
});
//# sourceMappingURL=scoring.validation.js.map