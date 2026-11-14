"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionStatus = exports.startVerification = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const asyncWrapper_1 = require("../utils/asyncWrapper");
const VerificationSession_1 = require("../models/VerificationSession");
const verificationService_1 = require("../services/verificationService");
const sessionStore_1 = require("../services/sessionStore");
const logger_1 = require("../utils/logger");
/**
 * POST /api/v1/verify
 *
 * Creates a verification session and starts the SSE stream.
 * Automatically uses In-Memory store if MongoDB is offline.
 */
exports.startVerification = (0, asyncWrapper_1.asyncWrapper)(async (req, res) => {
    const { answerText, context } = req.body;
    const userId = req.userId ? new mongoose_1.default.Types.ObjectId(req.userId) : new mongoose_1.default.Types.ObjectId('000000000000000000000001');
    let session;
    if ((0, sessionStore_1.isMongoConnected)()) {
        try {
            session = await VerificationSession_1.VerificationSession.create({
                userId,
                originalAnswer: answerText,
                context: context
                    ? { ...context, submittedAt: new Date() }
                    : { submittedAt: new Date() },
                status: 'PROCESSING',
            });
        }
        catch (dbErr) {
            logger_1.logger.warn('MongoDB session insert failed — falling back to inMemoryStore', { error: dbErr });
            session = sessionStore_1.inMemoryStore.createSession({
                userId,
                originalAnswer: answerText,
                context,
                status: 'PROCESSING',
            });
        }
    }
    else {
        session = sessionStore_1.inMemoryStore.createSession({
            userId,
            originalAnswer: answerText,
            context,
            status: 'PROCESSING',
        });
    }
    const sessionId = session._id || session.id;
    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    // Send initial event immediately
    res.write(`data: ${JSON.stringify({
        stage: 'SESSION_CREATED',
        sessionId: sessionId.toString(),
        timestamp: new Date().toISOString(),
    })}\n\n`);
    logger_1.logger.info('Verification session started', { sessionId: sessionId.toString(), userId: userId.toString() });
    // Run pipeline in background — SSE events pushed from within
    (0, verificationService_1.runVerificationPipeline)(sessionId, userId, answerText, context, res).catch((err) => {
        logger_1.logger.error('Pipeline runner caught uncaught error', { sessionId: sessionId.toString(), error: err });
    });
});
/**
 * GET /api/v1/verify/:sessionId
 *
 * Poll session status (alternative to SSE).
 */
exports.getSessionStatus = (0, asyncWrapper_1.asyncWrapper)(async (req, res) => {
    const sessionId = String(req.params.sessionId);
    const userId = req.userId;
    let session = null;
    if ((0, sessionStore_1.isMongoConnected)()) {
        try {
            session = await VerificationSession_1.VerificationSession.findOne({ _id: sessionId, userId }).lean();
        }
        catch {
            session = sessionStore_1.inMemoryStore.getSession(sessionId);
        }
    }
    else {
        session = sessionStore_1.inMemoryStore.getSession(sessionId);
    }
    if (!session) {
        res.status(404).json({
            success: false,
            error: { code: 'SESSION_NOT_FOUND', message: 'Verification session not found' },
        });
        return;
    }
    res.json({
        success: true,
        data: {
            sessionId: (session._id || session.id).toString(),
            status: session.status,
            aggregateFreshnessScore: session.aggregateFreshnessScore,
            riskLevel: session.riskLevel,
            totalClaims: session.pipeline?.totalClaims || 0,
            staleClaims: session.pipeline?.staleClaims || 0,
            reportId: session.reportId?.toString(),
            processingTimeMs: session.processingTimeMs,
            createdAt: session.createdAt,
        },
    });
});
//# sourceMappingURL=verifyController.js.map