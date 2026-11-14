"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractClaims = extractClaims;
const zod_1 = require("zod");
const bifrostClient_1 = require("../integrations/bifrostClient");
const claimExtractionPrompt_1 = require("../prompts/claimExtractionPrompt");
const logger_1 = require("../utils/logger");
const claimExtractionResponseSchema = zod_1.z.object({
    claims: zod_1.z.array(zod_1.z.object({
        claimText: zod_1.z.string().min(10).max(1000),
        order: zod_1.z.number().int().min(1),
    })).min(0).max(8),
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
async function extractClaims(answerText, sessionId) {
    logger_1.logger.info('Extracting claims from answer', {
        answerLength: answerText.length,
        sessionId,
    });
    const prompt = (0, claimExtractionPrompt_1.buildClaimExtractionPrompt)(answerText);
    const result = await (0, bifrostClient_1.bifrostChatJson)({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        maxTokens: 1024,
        sessionId,
        stage: 'CLAIM_EXTRACTION',
    }, claimExtractionResponseSchema);
    const claims = result.claims.map((c) => ({
        claimText: c.claimText.trim(),
        order: c.order,
    }));
    logger_1.logger.info('Claims extracted', { count: claims.length, sessionId });
    return claims;
}
//# sourceMappingURL=claimExtractorService.js.map