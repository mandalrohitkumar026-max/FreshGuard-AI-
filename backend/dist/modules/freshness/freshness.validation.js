"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeFreshnessApiRequestSchema = exports.freshnessAnalysisResponseSchema = exports.claimTemporalAnalysisSchema = exports.detectionMethodSchema = exports.recommendedSearchStrategySchema = exports.verificationDecisionSchema = exports.volatilityLevelSchema = exports.freshnessPrioritySchema = void 0;
const zod_1 = require("zod");
exports.freshnessPrioritySchema = zod_1.z.enum(['HIGH', 'MEDIUM', 'LOW', 'STABLE']);
exports.volatilityLevelSchema = zod_1.z.enum([
    'VERY_HIGH',
    'HIGH',
    'MODERATE',
    'LOW',
    'STABLE',
]);
exports.verificationDecisionSchema = zod_1.z.enum([
    'VERIFY_IMMEDIATELY',
    'VERIFY_LIVE',
    'VERIFY_IF_NEEDED',
    'NOT_REQUIRED',
]);
exports.recommendedSearchStrategySchema = zod_1.z.enum([
    'OFFICIAL_RELEASE_SEARCH',
    'LEADERSHIP_EXECUTIVE_SEARCH',
    'REALTIME_FINANCIAL_LOOKUP',
    'GOVERNMENT_REGULATION_SEARCH',
    'ACADEMIC_DEADLINE_SEARCH',
    'GENERAL_WEB_SEARCH',
    'SKIP_VERIFICATION',
]);
exports.detectionMethodSchema = zod_1.z.enum([
    'BIFROST_SEMANTIC',
    'DETERMINISTIC_RULES',
    'HYBRID',
]);
exports.claimTemporalAnalysisSchema = zod_1.z.object({
    claimId: zod_1.z.string().min(1),
    claimText: zod_1.z.string().min(1),
    isTimeSensitive: zod_1.z.boolean(),
    priority: exports.freshnessPrioritySchema,
    volatility: exports.volatilityLevelSchema,
    decision: exports.verificationDecisionSchema,
    requiresVerification: zod_1.z.boolean(),
    category: zod_1.z.string().default('GENERAL'),
    reason: zod_1.z.string().min(1),
    recommendedSearchStrategy: exports.recommendedSearchStrategySchema,
    preferredSourceType: zod_1.z.string().default('general'),
    detectionMethod: exports.detectionMethodSchema.default('HYBRID'),
    confidence: zod_1.z.number().min(0).max(1).default(0.9),
});
exports.freshnessAnalysisResponseSchema = zod_1.z.object({
    verificationId: zod_1.z.string(),
    totalClaims: zod_1.z.number().min(0),
    timeSensitiveCount: zod_1.z.number().min(0),
    stableCount: zod_1.z.number().min(0),
    analysis: zod_1.z.array(exports.claimTemporalAnalysisSchema),
    model: zod_1.z.string(),
    latencyMs: zod_1.z.number().min(0),
});
exports.analyzeFreshnessApiRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        verificationId: zod_1.z.string().optional(),
        claims: zod_1.z.array(zod_1.z.any()).optional(),
        answerText: zod_1.z.string().max(30000).optional(),
        topicHint: zod_1.z.string().max(100).optional(),
        model: zod_1.z.string().optional(),
    }).refine((data) => data.verificationId || (data.claims && data.claims.length > 0) || data.answerText, {
        message: 'Either "verificationId", "claims" array, or "answerText" must be provided',
        path: ['claims'],
    }),
});
//# sourceMappingURL=freshness.validation.js.map