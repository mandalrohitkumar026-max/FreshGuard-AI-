import { z } from 'zod';
import mongoose from 'mongoose';
import { bifrostChatJson } from '../integrations/bifrostClient';
import { buildCorrectionPrompt, StaleClaimCorrection } from '../prompts/correctionPrompt';
import { ScoredClaim } from '../types/verification.types';
import { logger } from '../utils/logger';

const correctionResponseSchema = z.object({
  correctedAnswer: z.string().min(50).max(15000),
  changedSections: z.array(z.string()),
});

export interface CorrectionResult {
  correctedAnswer: string;
  changedSections: string[];
}

/**
 * Correction Service (Pipeline Stage 11)
 *
 * When stale claims are detected, uses Bifrost-routed LLM to rewrite
 * the original answer, replacing outdated sections with evidence-supported facts
 * and inline citations.
 *
 * Only triggered when:
 * - At least one claim has verdict CONTRADICTS or PARTIALLY_CONTRADICTS
 * - AND that claim has confidence > 0.6
 */
export async function generateCorrectedAnswer(
  originalAnswer: string,
  scoredClaims: ScoredClaim[],
  sessionId?: mongoose.Types.ObjectId,
): Promise<CorrectionResult | null> {
  // Identify claims that need correction
  const staleClaimsToFix = scoredClaims.filter(
    (c) =>
      (c.verdict === 'CONTRADICTS' || c.verdict === 'PARTIALLY_CONTRADICTS') &&
      c.confidence > 0.6,
  );

  if (staleClaimsToFix.length === 0) {
    logger.info('No high-confidence stale claims — skipping correction', { sessionId });
    return null;
  }

  logger.info('Generating corrected answer', {
    staleClaimsCount: staleClaimsToFix.length,
    sessionId,
  });

  const corrections: StaleClaimCorrection[] = staleClaimsToFix.map((claim) => {
    const topEvidence = claim.evidence
      .filter((e) => e.usedInAnalysis)
      .sort((a, b) => b.authorityScore - a.authorityScore)[0];

    return {
      originalClaim: claim.claimText,
      verdict: claim.verdict,
      explanation: claim.explanation,
      topSourceUrl: topEvidence?.url ?? '',
      topSourceTitle: topEvidence?.title ?? 'Unknown source',
      evidenceContent: topEvidence?.content?.slice(0, 600) ?? '',
    };
  });

  const prompt = buildCorrectionPrompt(originalAnswer, corrections);

  try {
    const result = await bifrostChatJson(
      {
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        maxTokens: 2048,
        sessionId,
        stage: 'CORRECTION',
      },
      correctionResponseSchema,
    );

    logger.info('Corrected answer generated', {
      changedSections: result.changedSections.length,
      sessionId,
    });

    return result;
  } catch (err) {
    logger.error('Correction generation failed', {
      error: err instanceof Error ? err.message : String(err),
      sessionId,
    });
    return null; // Non-fatal — report will note correction unavailable
  }
}
