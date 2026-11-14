"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizedEvidenceSchema = exports.claimEvidenceRequestSchema = exports.searchQueryRequestSchema = void 0;
const zod_1 = require("zod");
exports.searchQueryRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        query: zod_1.z.string().min(2, 'Query must be at least 2 characters').max(300),
        searchDepth: zod_1.z.enum(['basic', 'advanced']).default('advanced').optional(),
        topic: zod_1.z.enum(['general', 'news', 'finance']).default('general').optional(),
        maxResults: zod_1.z.coerce.number().min(1).max(20).default(5).optional(),
        includeAnswer: zod_1.z.boolean().default(false).optional(),
    }),
});
exports.claimEvidenceRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        claim: zod_1.z.string().min(3, 'Claim must be at least 3 characters').max(1000).optional(),
        claimText: zod_1.z.string().min(3, 'Claim must be at least 3 characters').max(1000).optional(),
        topicHint: zod_1.z.string().max(100).optional(),
        searchDepth: zod_1.z.enum(['basic', 'advanced']).default('advanced').optional(),
        maxResults: zod_1.z.coerce.number().min(1).max(20).default(5).optional(),
        sessionId: zod_1.z.string().optional(),
        claimId: zod_1.z.string().optional(),
    }).refine((data) => data.claim || data.claimText, {
        message: 'Either "claim" or "claimText" is required',
        path: ['claimText'],
    }),
});
exports.normalizedEvidenceSchema = zod_1.z.object({
    sourceTitle: zod_1.z.string().min(1),
    sourceUrl: zod_1.z.string().url('Source URL must be a valid URL'),
    sourceDomain: zod_1.z.string().min(1),
    content: zod_1.z.string().min(1),
    publishedAt: zod_1.z.string().nullable(),
    retrievedAt: zod_1.z.string().min(1),
    relevanceScore: zod_1.z.number().min(0).max(1),
    authorityScore: zod_1.z.number().min(0).max(1),
    authorityTier: zod_1.z.enum(['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']),
    sourceType: zod_1.z.enum([
        'official_documentation',
        'government',
        'academic',
        'company_official',
        'established_news',
        'community',
        'general',
    ]),
    usedInAnalysis: zod_1.z.boolean(),
});
//# sourceMappingURL=search.validation.js.map