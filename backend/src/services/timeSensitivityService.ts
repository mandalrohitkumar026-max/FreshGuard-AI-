import { z } from 'zod';
import mongoose from 'mongoose';
import { bifrostChatJson } from '../integrations/bifrostClient';
import { buildTimeSensitivityPrompt } from '../prompts/timeSensitivityPrompt';
import { ExtractedClaim, TimeSensitivity } from '../types/verification.types';
import { logger } from '../utils/logger';

const timeSensitivityResponseSchema = z.object({
  classifications: z.array(
    z.object({
      order: z.number().int(),
      claimText: z.string(),
      timeSensitivity: z.enum(['STATIC', 'SEMI_DYNAMIC', 'HIGHLY_DYNAMIC']),
      reasoning: z.string(),
    }),
  ),
});

export interface ClassifiedClaim extends ExtractedClaim {
  timeSensitivity: TimeSensitivity;
  reasoning: string;
}

/**
 * Time-Sensitivity Service (Pipeline Stage 4)
 *
 * Classifies each extracted claim as STATIC, SEMI_DYNAMIC, or HIGHLY_DYNAMIC.
 * Only SEMI_DYNAMIC and HIGHLY_DYNAMIC claims enter the Tavily evidence pipeline.
 * STATIC claims receive a default freshness score of 100.
 */
export async function classifyTimeSensitivity(
  claims: ExtractedClaim[],
  sessionId?: mongoose.Types.ObjectId,
): Promise<ClassifiedClaim[]> {
  if (claims.length === 0) return [];

  logger.info('Classifying time sensitivity for claims', {
    count: claims.length,
    sessionId,
  });

  const prompt = buildTimeSensitivityPrompt(
    claims.map((c) => ({ claimText: c.claimText, order: c.order })),
  );

  const result = await bifrostChatJson(
    {
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      maxTokens: 1024,
      sessionId,
      stage: 'TIME_SENSITIVITY',
    },
    timeSensitivityResponseSchema,
  );

  // Map back to original claims by order, with fallback to SEMI_DYNAMIC if missing
  const classificationMap = new Map(
    result.classifications.map((c) => [c.order, c]),
  );

  return claims.map((claim) => {
    const classification = classificationMap.get(claim.order);
    return {
      ...claim,
      timeSensitivity: classification?.timeSensitivity ?? 'SEMI_DYNAMIC',
      reasoning: classification?.reasoning ?? 'Defaulted to SEMI_DYNAMIC',
    };
  });
}
