"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeClaimAgainstEvidence = analyzeClaimAgainstEvidence;
const zod_1 = require("zod");
const bifrostClient_1 = require("../integrations/bifrostClient");
const evidenceAnalysisPrompt_1 = require("../prompts/evidenceAnalysisPrompt");
const logger_1 = require("../utils/logger");
const analysisResponseSchema = zod_1.z.object({
    verdict: zod_1.z.enum(['CONFIRMS', 'CONTRADICTS', 'PARTIALLY_CONTRADICTS', 'INSUFFICIENT']),
    confidence: zod_1.z.number().min(0).max(1),
    explanation: zod_1.z.string().min(10).max(500),
    supportingEvidenceIndices: zod_1.z.array(zod_1.z.number().int()).default([]),
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
async function analyzeClaimAgainstEvidence(claimText, evidence, sessionId) {
    // Build evidence snippets for prompt injection
    const usableEvidence = evidence.filter((e) => e.usedInAnalysis).slice(0, 5);
    // Not enough evidence to analyze
    if (usableEvidence.length === 0) {
        logger_1.logger.debug('No usable evidence — returning INSUFFICIENT', {
            claim: claimText.slice(0, 60),
        });
        return {
            verdict: 'INSUFFICIENT',
            confidence: 0,
            explanation: 'No relevant evidence was found to verify this claim.',
            supportingEvidenceIndices: [],
        };
    }
    const snippets = usableEvidence.map((e, i) => ({
        index: i,
        url: e.url,
        title: e.title,
        content: e.content,
        domain: e.domain,
    }));
    const prompt = (0, evidenceAnalysisPrompt_1.buildEvidenceAnalysisPrompt)(claimText, snippets);
    try {
        const result = await (0, bifrostClient_1.bifrostChatJson)({
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            maxTokens: 512,
            sessionId,
            stage: 'AI_ANALYSIS',
        }, analysisResponseSchema);
        logger_1.logger.debug('Claim analysis complete', {
            claim: claimText.slice(0, 60),
            verdict: result.verdict,
            confidence: result.confidence,
        });
        return {
            verdict: result.verdict,
            confidence: result.confidence,
            explanation: result.explanation,
            supportingEvidenceIndices: result.supportingEvidenceIndices ?? [],
        };
    }
    catch (err) {
        logger_1.logger.warn('AI analysis failed — defaulting to INSUFFICIENT', {
            claim: claimText.slice(0, 60),
            error: err instanceof Error ? err.message : String(err),
        });
        return {
            verdict: 'INSUFFICIENT',
            confidence: 0,
            explanation: 'Evidence analysis could not be completed due to a technical error.',
            supportingEvidenceIndices: [],
        };
    }
}
//# sourceMappingURL=aiAnalysisService.js.map