"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationController = exports.VerificationController = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const verification_service_1 = require("./verification.service");
const answerEvolutionService_1 = require("./answerEvolutionService");
const auditTrailService_1 = require("./auditTrailService");
const claim_service_1 = require("../claims/claim.service");
const report_service_1 = require("../reports/report.service");
const verificationService_1 = require("../../services/verificationService");
const ApiError_1 = require("../../utils/ApiError");
class VerificationController {
    createVerification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const rawAnswer = req.body.originalAnswer || req.body.answerText;
        if (!rawAnswer) {
            throw ApiError_1.ApiError.badRequest('originalAnswer or answerText is required');
        }
        const context = req.body.context || {
            topic: req.body.topic,
            sourceModel: req.body.sourceModel,
        };
        const isStreaming = req.headers.accept === 'text/event-stream' || req.body.stream === true;
        const userId = req.userId || '000000000000000000000001';
        const session = await verification_service_1.verificationService.createSession({
            userId,
            originalAnswer: rawAnswer,
            context,
        });
        const sessionId = (session._id || session.id).toString();
        if (isStreaming) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            res.flushHeaders();
            res.write(`data: ${JSON.stringify({
                stage: 'SESSION_CREATED',
                sessionId,
                status: 'PROCESSING',
                timestamp: new Date().toISOString(),
            })}\n\n`);
            await (0, verificationService_1.runVerificationPipeline)(sessionId, userId, rawAnswer, context, res);
            return;
        }
        return ApiResponse_1.ApiResponse.created(res, {
            sessionId,
            status: session.status || 'PROCESSING',
            originalAnswer: rawAnswer,
            context,
            createdAt: session.createdAt,
        }, 'Verification session initiated successfully');
    });
    /**
     * Phase 08 Live Verification Runner:
     * Executes full evidence search, contradiction detection, and grounded correction.
     */
    runVerification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const sessionId = String(req.params.id);
        const result = await verification_service_1.verificationService.runVerification(sessionId);
        return ApiResponse_1.ApiResponse.ok(res, result, 'Verification pipeline executed successfully');
    });
    /**
     * Direct verification runner in a single call
     */
    verifyDirect = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const rawAnswer = req.body.originalAnswer || req.body.answerText;
        if (!rawAnswer) {
            throw ApiError_1.ApiError.badRequest('originalAnswer or answerText is required');
        }
        const userId = req.userId || '000000000000000000000001';
        const session = await verification_service_1.verificationService.createSession({
            userId,
            originalAnswer: rawAnswer,
            context: { topic: req.body.topic, sourceModel: req.body.sourceModel },
        });
        const sessionId = (session._id || session.id).toString();
        const result = await verification_service_1.verificationService.runVerification(sessionId);
        return ApiResponse_1.ApiResponse.created(res, result, 'Verification completed successfully');
    });
    getResults = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const results = await verification_service_1.verificationService.getVerificationResults(String(req.params.id));
        return ApiResponse_1.ApiResponse.ok(res, results, 'Verification results retrieved successfully');
    });
    getCorrection = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const correction = await verification_service_1.verificationService.getCorrection(String(req.params.id));
        return ApiResponse_1.ApiResponse.ok(res, correction, 'Grounded correction retrieved successfully');
    });
    getConflicts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const results = await verification_service_1.verificationService.getVerificationResults(String(req.params.id));
        const conflicts = (results.claims || [])
            .filter((c) => c.conflictAnalysis?.hasConflict)
            .map((c) => ({
            claimId: c.claimId,
            claimText: c.claimText,
            status: c.status,
            conflictAnalysis: c.conflictAnalysis,
        }));
        return ApiResponse_1.ApiResponse.ok(res, {
            sessionId: req.params.id,
            totalConflicts: conflicts.length,
            conflicts,
        }, 'Evidence conflicts retrieved successfully');
    });
    submitRevision = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { parentSessionId, revisedAnswer } = req.body;
        if (!parentSessionId || !revisedAnswer) {
            throw ApiError_1.ApiError.badRequest('parentSessionId and revisedAnswer are required');
        }
        const userId = req.userId || '000000000000000000000001';
        const result = await answerEvolutionService_1.answerEvolutionService.submitRevision({
            parentSessionId,
            revisedAnswer,
            userId,
            context: req.body.context,
        });
        return ApiResponse_1.ApiResponse.created(res, result, 'Answer revision verified and evolution tracked');
    });
    getEvolution = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const currentSessionId = String(req.params.id);
        const parentSessionId = req.query.previousSessionId || req.query.parentSessionId;
        if (!parentSessionId) {
            throw ApiError_1.ApiError.badRequest('previousSessionId or parentSessionId query param is required');
        }
        const evolution = await answerEvolutionService_1.answerEvolutionService.compareVersions(parentSessionId, currentSessionId);
        return ApiResponse_1.ApiResponse.ok(res, evolution, 'Answer evolution tracked successfully');
    });
    getAuditTrail = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const auditPackage = await auditTrailService_1.auditTrailService.generateAuditPackage(String(req.params.id));
        return ApiResponse_1.ApiResponse.ok(res, auditPackage, 'Tamper-evident verification audit trail retrieved');
    });
    exportAuditTrail = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const auditPackage = await auditTrailService_1.auditTrailService.generateAuditPackage(String(req.params.id));
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="freshguard-audit-${req.params.id}.json"`);
        res.send(JSON.stringify(auditPackage, null, 2));
    });
    getClaimEvidence = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const evidence = await verification_service_1.verificationService.getClaimEvidence(String(req.params.claimId));
        return ApiResponse_1.ApiResponse.ok(res, evidence, 'Claim evidence retrieved successfully');
    });
    getSession = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const session = await verification_service_1.verificationService.getSessionById(String(req.params.id), req.userId, req.userRole);
        return ApiResponse_1.ApiResponse.ok(res, session, 'Verification session details retrieved');
    });
    listSessions = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const userId = req.userId || '';
        const page = req.query.page ? parseInt(req.query.page, 10) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
        const riskLevel = req.query.riskLevel;
        const result = await verification_service_1.verificationService.listSessions(userId, { page, limit, riskLevel });
        return ApiResponse_1.ApiResponse.ok(res, result, 'Verification sessions retrieved');
    });
    deleteSession = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await verification_service_1.verificationService.deleteSession(String(req.params.id), req.userId);
        return ApiResponse_1.ApiResponse.ok(res, { message: 'Verification session deleted successfully' }, 'Verification session deleted successfully');
    });
    getClaims = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const claims = await claim_service_1.claimService.getClaimsBySessionId(String(req.params.id));
        return ApiResponse_1.ApiResponse.ok(res, claims, 'Extracted claims retrieved');
    });
    getReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const report = await report_service_1.reportService.getReport(String(req.params.id));
        return ApiResponse_1.ApiResponse.ok(res, report, 'Verification report retrieved');
    });
}
exports.VerificationController = VerificationController;
exports.verificationController = new VerificationController();
//# sourceMappingURL=verification.controller.js.map