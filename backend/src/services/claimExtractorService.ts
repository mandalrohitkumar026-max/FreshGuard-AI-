import { z } from 'zod';
import mongoose from 'mongoose';
import { bifrostChatJson } from '../integrations/bifrostClient';
import { buildClaimExtractionPrompt } from '../prompts/claimExtractionPrompt';
import { ExtractedClaim } from '../types/verification.types';
import { logger } from '../utils/logger';

const claimExtractionResponseSchema = z.object({
  claims: z.array(
    z.object({
      claimText: z.string().min(10).max(1000),
      order: z.number().int().min(1),
    }),
  ).min(0).max(8),
});

/**
 * Claim Extractor Service (Pipeline Stage 3)
 *
 * Uses Bifrost-routed LLM to extract atomic, verifiable factual claims
 * from a free-form answer text.
 *
 * Output is validated with Zod — any malformed LLM response throws,
 * which prevents hallucinated claim structures entering the pipeline.
 */
export async function extractClaims(
  answerText: string,
  sessionId?: mongoose.Types.ObjectId,
): Promise<ExtractedClaim[]> {
  logger.info('Extracting claims from answer', {
    answerLength: answerText.length,
    sessionId,
  });

  const prompt = buildClaimExtractionPrompt(answerText);

  const result = await bifrostChatJson(
    {
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      maxTokens: 1024,
      sessionId,
      stage: 'CLAIM_EXTRACTION',
    },
    claimExtractionResponseSchema,
  );

  const claims: ExtractedClaim[] = result.claims.map((c) => ({
    claimText: c.claimText.trim(),
    order: c.order,
  }));

  logger.info('Claims extracted', { count: claims.length, sessionId });
  return claims;
}
