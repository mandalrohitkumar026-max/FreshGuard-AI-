import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncWrapper } from '../utils/asyncWrapper';
import { VerificationSession } from '../models/VerificationSession';
import { runVerificationPipeline } from '../services/verificationService';
import { inMemoryStore, isMongoConnected } from '../services/sessionStore';
import { logger } from '../utils/logger';

/**
 * POST /api/v1/verify
 *
 * Creates a verification session and starts the SSE stream.
 * Automatically uses In-Memory store if MongoDB is offline.
 */
export const startVerification = asyncWrapper(async (req: Request, res: Response) => {
  const { answerText, context } = req.body;
  const userId = req.userId ? new mongoose.Types.ObjectId(req.userId) : new mongoose.Types.ObjectId('000000000000000000000001');

  let session: any;

  if (isMongoConnected()) {
    try {
      session = await VerificationSession.create({
        userId,
        originalAnswer: answerText,
        context: context
          ? { ...context, submittedAt: new Date() }
          : { submittedAt: new Date() },
        status: 'PROCESSING',
      });
    } catch (dbErr) {
      logger.warn('MongoDB session insert failed — falling back to inMemoryStore', { error: dbErr });
      session = inMemoryStore.createSession({
        userId,
        originalAnswer: answerText,
        context,
        status: 'PROCESSING',
      });
    }
  } else {
    session = inMemoryStore.createSession({
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

  logger.info('Verification session started', { sessionId: sessionId.toString(), userId: userId.toString() });

  // Run pipeline in background — SSE events pushed from within
  runVerificationPipeline(sessionId, userId, answerText, context, res).catch((err) => {
    logger.error('Pipeline runner caught uncaught error', { sessionId: sessionId.toString(), error: err });
  });
});

/**
 * GET /api/v1/verify/:sessionId
 *
 * Poll session status (alternative to SSE).
 */
export const getSessionStatus = asyncWrapper(async (req: Request, res: Response) => {
  const sessionId = String(req.params.sessionId);
  const userId = req.userId!;

  let session: any = null;

  if (isMongoConnected()) {
    try {
      session = await VerificationSession.findOne({ _id: sessionId, userId }).lean();
    } catch {
      session = inMemoryStore.getSession(sessionId);
    }
  } else {
    session = inMemoryStore.getSession(sessionId);
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
