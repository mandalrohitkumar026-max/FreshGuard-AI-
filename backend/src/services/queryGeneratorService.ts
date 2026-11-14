import { z } from 'zod';
import mongoose from 'mongoose';
import { bifrostChatJson } from '../integrations/bifrostClient';
import { buildQueryGenerationPrompt } from '../prompts/queryGenerationPrompt';
import { ClassifiedClaim } from './timeSensitivityService';
import { logger } from '../utils/logger';

const queryResponseSchema = z.object({
  searchQuery: z.string().min(5).max(200),
});

/**
 * Query Generator Service (Pipeline Stage 5)
 *
 * Uses Bifrost-routed LLM to craft an optimal Tavily search query
 * for each time-sensitive claim.
 *
 * STATIC claims are skipped — they don't need evidence retrieval.
 */
export async function generateSearchQuery(
  claim: ClassifiedClaim,
  sessionId?: mongoose.Types.ObjectId,
): Promise<string> {
  const prompt = buildQueryGenerationPrompt(claim.claimText, claim.timeSensitivity);

  const result = await bifrostChatJson(
    {
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      maxTokens: 128,
      sessionId,
      stage: 'QUERY_GENERATION',
    },
    queryResponseSchema,
  );

  logger.debug('Search query generated', {
    claimText: claim.claimText.slice(0, 60),
    searchQuery: result.searchQuery,
    sessionId,
  });

  return result.searchQuery;
}

/**
 * Generate search queries for all non-STATIC claims in parallel.
 */
export async function generateSearchQueries(
  claims: ClassifiedClaim[],
  sessionId?: mongoose.Types.ObjectId,
): Promise<Map<number, string>> {
  const dynamicClaims = claims.filter((c) => c.timeSensitivity !== 'STATIC');
  const queryMap = new Map<number, string>();

  await Promise.allSettled(
    dynamicClaims.map(async (claim) => {
      try {
        const query = await generateSearchQuery(claim, sessionId);
        queryMap.set(claim.order, query);
      } catch (err) {
        logger.warn('Query generation failed for claim', {
          claimText: claim.claimText.slice(0, 60),
          error: err instanceof Error ? err.message : String(err),
        });
        // Fallback: use claim text as the search query
        queryMap.set(claim.order, claim.claimText.slice(0, 150));
      }
    }),
  );

  return queryMap;
}
