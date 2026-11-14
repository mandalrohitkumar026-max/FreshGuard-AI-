import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { verificationService } from '../verification/verification.service';
import { auditTrailService } from '../verification/auditTrailService';
import { apiKeyService } from './apiKeyService';

export const developerVerifySchema = z.object({
  answerText: z.string().min(5, 'answerText must be at least 5 characters').max(10000, 'answerText max 10,000 characters'),
  topic: z.string().max(200).optional(),
  strictness: z.enum(['strict', 'balanced', 'permissive']).default('balanced'),
  sourceModel: z.string().max(100).optional(),
});

export class DeveloperController {
  /**
   * POST /api/v1/developer/verify
   * Submits an AI answer for real-time fact and freshness verification.
   */
  verify = asyncHandler(async (req: Request, res: Response) => {
    const parseResult = developerVerifySchema.safeParse(req.body);
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
    const session = await verificationService.createSession({
      userId,
      originalAnswer: sanitizedAnswer,
      context: { topic, sourceModel, strictness, source: 'DEVELOPER_API' },
    });

    const sessionId = (session._id || session.id).toString();

    // 2. Execute Full Verification Pipeline
    const verification = await verificationService.runVerification(sessionId);

    return ApiResponse.created(
      res,
      {
        sessionId,
        status: verification.status,
        overallFreshnessScore: verification.summary?.overallFreshnessScore,
        overallRiskLevel: verification.summary?.overallRiskLevel,
        summary: verification.summary,
        claims: verification.claims,
        correction: verification.correction,
        processingTimeMs: verification.processingTimeMs,
        completedAt: verification.completedAt,
      },
      'Developer verification completed successfully',
    );
  });

  /**
   * GET /api/v1/developer/reports/:id
   */
  getReport = asyncHandler(async (req: Request, res: Response) => {
    const results = await verificationService.getVerificationResults(String(req.params.id));
    return ApiResponse.ok(res, results, 'Report retrieved');
  });

  /**
   * GET /api/v1/developer/conflicts/:id
   */
  getConflicts = asyncHandler(async (req: Request, res: Response) => {
    const results = await verificationService.getVerificationResults(String(req.params.id));
    const conflicts = (results.claims || [])
      .filter((c: any) => c.conflictAnalysis?.hasConflict)
      .map((c: any) => ({
        claimId: c.claimId,
        claimText: c.claimText,
        conflictAnalysis: c.conflictAnalysis,
      }));

    return ApiResponse.ok(
      res,
      { sessionId: req.params.id, totalConflicts: conflicts.length, conflicts },
      'Evidence conflicts retrieved',
    );
  });

  /**
   * GET /api/v1/developer/audit-trail/:id
   */
  getAuditTrail = asyncHandler(async (req: Request, res: Response) => {
    const auditPackage = await auditTrailService.generateAuditPackage(String(req.params.id));
    return ApiResponse.ok(res, auditPackage, 'Verifiable audit trail retrieved');
  });

  /**
   * POST /api/v1/developer/keys
   */
  createKey = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId || '000000000000000000000001';
    const name = req.body.name || 'API Key';
    const { key, rawKey } = apiKeyService.generateKey(userId, name);

    return ApiResponse.created(
      res,
      {
        id: key.id,
        name: key.name,
        apiKey: rawKey,
        keyPrefix: key.keyPrefix,
        rateLimitPerMinute: key.rateLimitPerMinute,
        createdAt: key.createdAt,
        warning: 'Store this API key safely. It will not be shown again.',
      },
      'Developer API key generated',
    );
  });

  /**
   * GET /api/v1/developer/keys
   */
  listKeys = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId || '000000000000000000000001';
    const keys = apiKeyService.listKeys(userId);
    return ApiResponse.ok(res, { keys }, 'Active developer API keys retrieved');
  });

  /**
   * DELETE /api/v1/developer/keys/:id
   */
  revokeKey = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId || '000000000000000000000001';
    const success = apiKeyService.revokeKey(String(req.params.id), userId);
    if (!success) {
      throw ApiError.notFound('API key not found or already revoked');
    }
    return ApiResponse.ok(res, { message: 'API key revoked successfully' }, 'API key revoked');
  });
}

export const developerController = new DeveloperController();
