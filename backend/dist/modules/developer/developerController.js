"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.developerController = exports.DeveloperController = exports.developerVerifySchema = void 0;
const zod_1 = require("zod");
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const ApiError_1 = require("../../utils/ApiError");
const verification_service_1 = require("../verification/verification.service");
const auditTrailService_1 = require("../verification/auditTrailService");
const apiKeyService_1 = require("./apiKeyService");
exports.developerVerifySchema = zod_1.z.object({
    answerText: zod_1.z.string().min(5, 'answerText must be at least 5 characters').max(10000, 'answerText max 10,000 characters'),
    topic: zod_1.z.string().max(200).optional(),
    strictness: zod_1.z.enum(['strict', 'balanced', 'permissive']).default('balanced'),
    sourceModel: zod_1.z.string().max(100).optional(),
});
class DeveloperController {
    /**
     * POST /api/v1/developer/verify
     * Submits an AI answer for real-time fact and freshness verification.
     */
    verify = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const parseResult = exports.developerVerifySchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_REQUEST_PAYLOAD',
                    message: parseResult.error.issues[0]?.message || 'Invalid payload parameters',
                    details: parseResult.error.format(),
                },
            });
        }
        const { answerText, topic, sourceModel, strictness } = parseResult.data;
        const userId = req.developerKey?.userId || req.userId || '000000000000000000000001';
        // Anti-injection sanitization: strip dangerous control characters and null bytes
        const sanitizedAnswer = answerText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
        // 1. Create Session
        const session = await verification_service_1.verificationService.createSession({
            userId,
            originalAnswer: sanitizedAnswer,
            context: { topic, sourceModel, strictness, source: 'DEVELOPER_API' },
        });
        const sessionId = (session._id || session.id).toString();
        // 2. Execute Full Verification Pipeline
        const verification = await verification_service_1.verificationService.runVerification(sessionId);
        return ApiResponse_1.ApiResponse.created(res, {
            sessionId,
            status: verification.status,
            overallFreshnessScore: verification.summary?.overallFreshnessScore,
            overallRiskLevel: verification.summary?.overallRiskLevel,
            summary: verification.summary,
            claims: verification.claims,
            correction: verification.correction,
            processingTimeMs: verification.processingTimeMs,
            completedAt: verification.completedAt,
        }, 'Developer verification completed successfully');
    });
    /**
     * GET /api/v1/developer/reports/:id
     */
    getReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const results = await verification_service_1.verificationService.getVerificationResults(String(req.params.id));
        return ApiResponse_1.ApiResponse.ok(res, results, 'Report retrieved');
    });
    /**
     * GET /api/v1/developer/conflicts/:id
     */
    getConflicts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const results = await verification_service_1.verificationService.getVerificationResults(String(req.params.id));
        const conflicts = (results.claims || [])
            .filter((c) => c.conflictAnalysis?.hasConflict)
            .map((c) => ({
            claimId: c.claimId,
            claimText: c.claimText,
            conflictAnalysis: c.conflictAnalysis,
        }));
        return ApiResponse_1.ApiResponse.ok(res, { sessionId: req.params.id, totalConflicts: conflicts.length, conflicts }, 'Evidence conflicts retrieved');
    });
    /**
     * GET /api/v1/developer/audit-trail/:id
     */
    getAuditTrail = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const auditPackage = await auditTrailService_1.auditTrailService.generateAuditPackage(String(req.params.id));
        return ApiResponse_1.ApiResponse.ok(res, auditPackage, 'Verifiable audit trail retrieved');
    });
    /**
     * POST /api/v1/developer/keys
     */
    createKey = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const userId = req.userId || '000000000000000000000001';
        const name = req.body.name || 'API Key';
        const { key, rawKey } = apiKeyService_1.apiKeyService.generateKey(userId, name);
        return ApiResponse_1.ApiResponse.created(res, {
            id: key.id,
            name: key.name,
            apiKey: rawKey,
            keyPrefix: key.keyPrefix,
            rateLimitPerMinute: key.rateLimitPerMinute,
            createdAt: key.createdAt,
            warning: 'Store this API key safely. It will not be shown again.',
        }, 'Developer API key generated');
    });
    /**
     * GET /api/v1/developer/keys
     */
    listKeys = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const userId = req.userId || '000000000000000000000001';
        const keys = apiKeyService_1.apiKeyService.listKeys(userId);
        return ApiResponse_1.ApiResponse.ok(res, { keys }, 'Active developer API keys retrieved');
    });
    /**
     * DELETE /api/v1/developer/keys/:id
     */
    revokeKey = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const userId = req.userId || '000000000000000000000001';
        const success = apiKeyService_1.apiKeyService.revokeKey(String(req.params.id), userId);
        if (!success) {
            throw ApiError_1.ApiError.notFound('API key not found or already revoked');
        }
        return ApiResponse_1.ApiResponse.ok(res, { message: 'API key revoked successfully' }, 'API key revoked');
    });
}
exports.DeveloperController = DeveloperController;
exports.developerController = new DeveloperController();
//# sourceMappingURL=developerController.js.map