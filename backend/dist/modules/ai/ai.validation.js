"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCorrectionRequestSchema = exports.analyzeEvidenceRequestSchema = exports.analyzeClaimsRequestSchema = exports.extractClaimsRequestSchema = exports.correctionResponseSchema = exports.evidenceAnalysisResponseSchema = exports.timeSensitivityResponseSchema = exports.timeSensitivityItemSchema = exports.claimExtractionResponseSchema = exports.claimItemSchema = void 0;
const zod_1 = require("zod");
// ── Model Output Validation Schemas ────────────────────────────────────────
exports.claimItemSchema = zod_1.z.object({
    claimText: zod_1.z.string().min(3, 'Claim text must be at least 3 characters'),
    category: zod_1.z.string().default('general'),
    timeSensitive: zod_1.z.boolean().default(false),
    reason: zod_1.z.string().default(''),
});
exports.claimExtractionResponseSchema = zod_1.z.object({
    claims: zod_1.z.array(exports.claimItemSchema).min(1, 'At least one claim must be extracted'),
});
exports.timeSensitivityItemSchema = zod_1.z.object({
    claimText: zod_1.z.string().min(1),
    timeSensitivity: zod_1.z.enum(['STATIC', 'SEMI_DYNAMIC', 'HIGHLY_DYNAMIC']),
    reason: zod_1.z.string().default(''),
    changeLikelihood: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']).default('LOW'),
});
exports.timeSensitivityResponseSchema = zod_1.z.object({
    classifications: zod_1.z.array(exports.timeSensitivityItemSchema),
});
exports.evidenceAnalysisResponseSchema = zod_1.z.object({
    verdict: zod_1.z.enum(['CONFIRMS', 'CONTRADICTS', 'PARTIALLY_CONTRADICTS', 'INSUFFICIENT']),
    confidence: zod_1.z.number().min(0).max(1),
    supportingStatements: zod_1.z.array(zod_1.z.string()).default([]),
    contradictions: zod_1.z.array(zod_1.z.string()).default([]),
    explanation: zod_1.z.string().min(1, 'Explanation is required'),
});
exports.correctionResponseSchema = zod_1.z.object({
    hasModifications: zod_1.z.boolean().default(true),
    correctedAnswer: zod_1.z.string().min(1),
    changeExplanation: zod_1.z.string().default(''),
    confidence: zod_1.z.number().min(0).max(1).default(1),
});
// ── HTTP API Request Validation Schemas ────────────────────────────────────
exports.extractClaimsRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        answerText: zod_1.z.string().min(10, 'Answer text must be at least 10 characters').max(15000),
        topicHint: zod_1.z.string().max(100).optional(),
        model: zod_1.z.string().optional(),
    }),
});
exports.analyzeClaimsRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        claims: zod_1.z.array(zod_1.z.string().min(3)).min(1, 'At least one claim is required'),
        model: zod_1.z.string().optional(),
    }),
});
exports.analyzeEvidenceRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        claimText: zod_1.z.string().min(3, 'Claim text is required'),
        evidence: zod_1.z.array(zod_1.z.object({
            title: zod_1.z.string().optional(),
            url: zod_1.z.string().optional(),
            content: zod_1.z.string().min(1, 'Evidence content is required'),
            domain: zod_1.z.string().optional(),
            publishedDate: zod_1.z.string().optional(),
        })).min(1, 'At least one evidence item is required'),
        model: zod_1.z.string().optional(),
    }),
});
exports.generateCorrectionRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        originalAnswer: zod_1.z.string().min(10, 'Original answer is required'),
        claims: zod_1.z.array(zod_1.z.object({
            claimText: zod_1.z.string(),
            verdict: zod_1.z.string(),
            explanation: zod_1.z.string().optional(),
            evidence: zod_1.z.array(zod_1.z.any()).optional(),
        })).min(1, 'At least one verified claim is required'),
        model: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=ai.validation.js.map