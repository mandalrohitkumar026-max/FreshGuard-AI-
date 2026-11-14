import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { freshnessDetectionService } from './freshnessDetectionService';

export class FreshnessController {
  /**
   * POST /api/v1/freshness/analyze
   * Evaluates time sensitivity, priority, volatility, and verification requirement for claims.
   */
  analyzeFreshness = asyncHandler(async (req: Request, res: Response) => {
    const { verificationId, claims, answerText, topicHint, model } = req.body;
    const userId = (req as any).user?._id?.toString();

    const input = answerText || claims || [];
    const result = await freshnessDetectionService.analyzeFreshness(input, {
      verificationId,
      userId,
      model,
      persistToDb: true,
    });

    return ApiResponse.ok(res, result, 'Temporal freshness analysis completed successfully');
  });

  /**
   * GET /api/v1/freshness/:verificationId
   * Retrieves freshness detection results for a verification session.
   */
  getFreshnessByVerificationId = asyncHandler(async (req: Request, res: Response) => {
    const verificationId = String(req.params.verificationId);
    const analysis = await freshnessDetectionService.getFreshnessByVerificationId(verificationId);

    return ApiResponse.ok(
      res,
      {
        verificationId,
        totalClaims: analysis.length,
        timeSensitiveCount: analysis.filter((a) => a.isTimeSensitive).length,
        stableCount: analysis.filter((a) => !a.isTimeSensitive).length,
        analysis,
      },
      'Verification freshness analysis retrieved successfully',
    );
  });
}

export const freshnessController = new FreshnessController();
