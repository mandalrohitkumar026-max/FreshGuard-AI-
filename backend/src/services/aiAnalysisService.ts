import { z } from 'zod';
import mongoose from 'mongoose';
import { bifrostChatJson } from '../integrations/bifrostClient';
import { buildEvidenceAnalysisPrompt, EvidenceSnippet } from '../prompts/evidenceAnalysisPrompt';
import { EvidenceItem, ClaimAnalysisResult, Verdict } from '../types/verification.types';
import { logger } from '../utils/logger';

const analysisResponseSchema = z.object({
  verdict: z.enum(['CONFIRMS', 'CONTRADICTS', 'PARTIALLY_CONTRADICTS', 'INSUFFICIENT']),
  confidence: z.number().min(0).max(1),
  explanation: z.string().min(10).max(500),
  supportingEvidenceIndices: z.array(z.number().int()).default([]),
});

/**
 * AI Analysis Service (Pipeline Stage 8)
 *
 * Uses Bifrost-routed LLM to compare a claim against retrieved evidence.
 *
 * Hallucination Guards:
 * 1. Evidence is injected verbatim — model cannot fabricate sources
 * 2. Model must cite snippet indices supporting its verdict
 * 3. Response is validated with Zod — malformed responses throw
 */
export async function analyzeClaimAgainstEvidence(
  claimText: string,
  evidence: EvidenceItem[],
  sessionId?: mongoose.Types.ObjectId,
): Promise<ClaimAnalysisResult> {
  // Build evidence snippets for prompt injection
  const usableEvidence = evidence.filter((e) => e.usedInAnalysis).slice(0, 5);

  // Not enough evidence to analyze
  if (usableEvidence.length === 0) {
    logger.debug('No usable evidence — returning INSUFFICIENT', {
      claim: claimText.slice(0, 60),
    });
    return {
      verdict: 'INSUFFICIENT' as Verdict,
      confidence: 0,
      explanation: 'No relevant evidence was found to verify this claim.',
      supportingEvidenceIndices: [],
    };
  }

  const snippets: EvidenceSnippet[] = usableEvidence.map((e, i) => ({
    index: i,
    url: e.url,
    title: e.title,
    content: e.content,
    domain: e.domain,
  }));

  const prompt = buildEvidenceAnalysisPrompt(claimText, snippets);

  try {
    const result = await bifrostChatJson(
      {
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        maxTokens: 512,
        sessionId,
        stage: 'AI_ANALYSIS',
      },
      analysisResponseSchema,
    );

    logger.debug('Claim analysis complete', {
      claim: claimText.slice(0, 60),
      verdict: result.verdict,
      confidence: result.confidence,
    });

    return {
      verdict: result.verdict as Verdict,
      confidence: result.confidence,
      explanation: result.explanation,
      supportingEvidenceIndices: result.supportingEvidenceIndices ?? [],
    };
  } catch (err) {
    logger.warn('AI analysis failed — defaulting to INSUFFICIENT', {
      claim: claimText.slice(0, 60),
      error: err instanceof Error ? err.message : String(err),
    });

    return {
      verdict: 'INSUFFICIENT' as Verdict,
      confidence: 0,
      explanation: 'Evidence analysis could not be completed due to a technical error.',
      supportingEvidenceIndices: [],
    };
  }
}
