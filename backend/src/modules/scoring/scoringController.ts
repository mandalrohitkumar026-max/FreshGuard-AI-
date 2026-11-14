import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { scoringService } from './scoring.service';
import { verificationService } from '../verification/verification.service';

export class ScoringController {
  getConfig = asyncHandler(async (req: Request, res: Response) => {
    const config = scoringService.getConfig();
    return ApiResponse.ok(res, config, 'Scoring configuration retrieved');
  });

  evaluateClaim = asyncHandler(async (req: Request, res: Response) => {
    const claim = req.body;
    if (!claim || !claim.claimText) {
      throw ApiError.badRequest('claimText is required');
    }
    const result = scoringService.evaluateClaim(claim);
    return ApiResponse.ok(res, result, 'Claim evaluated successfully');
  });

  evaluateAnswer = asyncHandler(async (req: Request, res: Response) => {
    const { claims } = req.body;
    if (!claims || !Array.isArray(claims)) {
      throw ApiError.badRequest('claims array is required');
    }
    const result = scoringService.evaluateAnswer(claims);
    return ApiResponse.ok(res, result, 'Answer evaluated successfully');
  });

  recalculateSession = asyncHandler(async (req: Request, res: Response) => {
    const sessionId = String(req.params.sessionId);
    const existingResult = await verificationService.getVerificationResults(sessionId);

    const scoringInput = (existingResult.claims || []).map((c: any) => ({
      claimId: c.claimId,
      order: c.order,
      claimText: c.claimText,
      timeSensitivity: (c.status === 'NOT_CHECKED' ? 'STATIC' : 'HIGHLY_DYNAMIC') as any,
      verdict: c.verdict,
      status: c.status,
      confidence: c.confidence,
      explanation: c.explanation,
      evidence: [...(c.contradictingEvidence || []), ...(c.supportingEvidence || [])],
      conflictAnalysis: c.conflictAnalysis,
    }));

    const evaluated = scoringService.evaluateAnswer(scoringInput);

    // Update in-memory and database
    existingResult.summary.overallFreshnessScore = evaluated.overallFreshnessScore;
    existingResult.summary.overallRiskLevel = evaluated.overallRiskLevel as any;
    existingResult.summary.freshnessInterpretation = evaluated.freshnessInterpretation;
    existingResult.summary.riskExplanation = evaluated.riskExplanation;

    (existingResult.claims || []).forEach((c: any, idx: number) => {
      const sc = evaluated.claims[idx];
      if (sc) {
        c.freshnessScore = sc.freshnessScore;
        c.riskLevel = sc.riskLevel;
        c.factors = sc.factors;
        c.recommendedAction = sc.recommendedAction;
      }
    });

    return ApiResponse.ok(res, evaluated, 'Session freshness and risk recalculated successfully');
  });
}

export const scoringController = new ScoringController();
