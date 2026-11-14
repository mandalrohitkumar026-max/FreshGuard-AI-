"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCorrectedAnswer = generateCorrectedAnswer;
const zod_1 = require("zod");
const bifrostClient_1 = require("../integrations/bifrostClient");
const correctionPrompt_1 = require("../prompts/correctionPrompt");
const logger_1 = require("../utils/logger");
const correctionResponseSchema = zod_1.z.object({
    correctedAnswer: zod_1.z.string().min(50).max(15000),
    changedSections: zod_1.z.array(zod_1.z.string()),
});
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
async function generateCorrectedAnswer(originalAnswer, scoredClaims, sessionId) {
    // Identify claims that need correction
    const staleClaimsToFix = scoredClaims.filter((c) => (c.verdict === 'CONTRADICTS' || c.verdict === 'PARTIALLY_CONTRADICTS') &&
        c.confidence > 0.6);
    if (staleClaimsToFix.length === 0) {
        logger_1.logger.info('No high-confidence stale claims — skipping correction', { sessionId });
        return null;
    }
    logger_1.logger.info('Generating corrected answer', {
        staleClaimsCount: staleClaimsToFix.length,
        sessionId,
    });
    const corrections = staleClaimsToFix.map((claim) => {
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
    const prompt = (0, correctionPrompt_1.buildCorrectionPrompt)(originalAnswer, corrections);
    try {
        const result = await (0, bifrostClient_1.bifrostChatJson)({
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            maxTokens: 2048,
            sessionId,
            stage: 'CORRECTION',
        }, correctionResponseSchema);
        logger_1.logger.info('Corrected answer generated', {
            changedSections: result.changedSections.length,
            sessionId,
        });
        return result;
    }
    catch (err) {
        logger_1.logger.error('Correction generation failed', {
            error: err instanceof Error ? err.message : String(err),
            sessionId,
        });
        return null; // Non-fatal — report will note correction unavailable
    }
}
//# sourceMappingURL=correctionService.js.map