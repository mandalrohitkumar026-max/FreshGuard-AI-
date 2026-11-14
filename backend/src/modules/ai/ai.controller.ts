import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { aiService } from './ai.service';
import { aiGateway } from './ai.gateway';

export class AIController {
  getBifrostHealth = asyncHandler(async (_req: Request, res: Response) => {
    const health = await aiGateway.checkHealth();
    return ApiResponse.ok(res, health, 'Bifrost AI Gateway health retrieved');
  });

  extractClaims = asyncHandler(async (req: Request, res: Response) => {
    const { answerText, topicHint, model } = req.body;
    const result = await aiService.extractClaims(answerText, topicHint, model);
    return ApiResponse.ok(res, result, 'Factual claims extracted successfully');
  });

  analyzeClaims = asyncHandler(async (req: Request, res: Response) => {
    const { claims, model } = req.body;
    const result = await aiService.analyzeTimeSensitivity(claims, model);
    return ApiResponse.ok(res, result, 'Claim time sensitivity analyzed successfully');
  });

  analyzeEvidence = asyncHandler(async (req: Request, res: Response) => {
    const { claimText, evidence, model } = req.body;
    const result = await aiService.analyzeEvidence(claimText, evidence, model);
    return ApiResponse.ok(res, result, 'Evidence analyzed successfully against claim');
  });

  generateCorrection = asyncHandler(async (req: Request, res: Response) => {
    const { originalAnswer, claims, model } = req.body;
    const result = await aiService.generateCorrection(originalAnswer, claims, model);
    return ApiResponse.ok(res, result, 'Corrected answer generated successfully');
  });
}

export const aiController = new AIController();
