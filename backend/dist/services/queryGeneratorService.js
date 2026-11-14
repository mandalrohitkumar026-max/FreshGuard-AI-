"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSearchQuery = generateSearchQuery;
exports.generateSearchQueries = generateSearchQueries;
const zod_1 = require("zod");
const bifrostClient_1 = require("../integrations/bifrostClient");
const queryGenerationPrompt_1 = require("../prompts/queryGenerationPrompt");
const logger_1 = require("../utils/logger");
const queryResponseSchema = zod_1.z.object({
    searchQuery: zod_1.z.string().min(5).max(200),
});
/**
 * Query Generator Service (Pipeline Stage 5)
 *
 * Uses Bifrost-routed LLM to craft an optimal Tavily search query
 * for each time-sensitive claim.
 *
 * STATIC claims are skipped — they don't need evidence retrieval.
 */
async function generateSearchQuery(claim, sessionId) {
    const prompt = (0, queryGenerationPrompt_1.buildQueryGenerationPrompt)(claim.claimText, claim.timeSensitivity);
    const result = await (0, bifrostClient_1.bifrostChatJson)({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        maxTokens: 128,
        sessionId,
        stage: 'QUERY_GENERATION',
    }, queryResponseSchema);
    logger_1.logger.debug('Search query generated', {
        claimText: claim.claimText.slice(0, 60),
        searchQuery: result.searchQuery,
        sessionId,
    });
    return result.searchQuery;
}
/**
 * Generate search queries for all non-STATIC claims in parallel.
 */
async function generateSearchQueries(claims, sessionId) {
    const dynamicClaims = claims.filter((c) => c.timeSensitivity !== 'STATIC');
    const queryMap = new Map();
    await Promise.allSettled(dynamicClaims.map(async (claim) => {
        try {
            const query = await generateSearchQuery(claim, sessionId);
            queryMap.set(claim.order, query);
        }
        catch (err) {
            logger_1.logger.warn('Query generation failed for claim', {
                claimText: claim.claimText.slice(0, 60),
                error: err instanceof Error ? err.message : String(err),
            });
            // Fallback: use claim text as the search query
            queryMap.set(claim.order, claim.claimText.slice(0, 150));
        }
    }));
    return queryMap;
}
//# sourceMappingURL=queryGeneratorService.js.map