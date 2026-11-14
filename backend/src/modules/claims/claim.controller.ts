import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { claimExtractionService } from './claimExtractionService';

export class ClaimController {
  /**
   * POST /api/v1/claims/extract
   * Converts full AI answer text into discrete, categorized atomic claims.
   */
  extractClaims = asyncHandler(async (req: Request, res: Response) => {
    const { answer, verificationId, topicHint, model } = req.body;
    const userId = (req as any).user?._id?.toString();

    const result = await claimExtractionService.extractClaims(answer, {
      verificationId,
      userId,
      topicHint,
      model,
      persistToDb: true,
    });

    return ApiResponse.ok(res, result, 'Claims extracted and structured successfully');
  });

  /**
   * GET /api/v1/claims/verification/:verificationId
   * Retrieves extracted claims associated with a verification ID.
   */
  getClaimsByVerification = asyncHandler(async (req: Request, res: Response) => {
    const verificationId = String(req.params.verificationId);
    const claims = await claimExtractionService.getClaimsByVerificationId(verificationId);

    return ApiResponse.ok(
      res,
      { verificationId, totalClaims: claims.length, claims },
      'Verification claims retrieved successfully',
    );
  });
}

export const claimController = new ClaimController();
