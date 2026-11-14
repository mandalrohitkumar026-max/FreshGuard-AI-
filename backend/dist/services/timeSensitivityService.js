"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyTimeSensitivity = classifyTimeSensitivity;
const zod_1 = require("zod");
const bifrostClient_1 = require("../integrations/bifrostClient");
const timeSensitivityPrompt_1 = require("../prompts/timeSensitivityPrompt");
const logger_1 = require("../utils/logger");
const timeSensitivityResponseSchema = zod_1.z.object({
    classifications: zod_1.z.array(zod_1.z.object({
        order: zod_1.z.number().int(),
        claimText: zod_1.z.string(),
        timeSensitivity: zod_1.z.enum(['STATIC', 'SEMI_DYNAMIC', 'HIGHLY_DYNAMIC']),
        reasoning: zod_1.z.string(),
    })),
});
/**
 * Time-Sensitivity Service (Pipeline Stage 4)
 *
 * Classifies each extracted claim as STATIC, SEMI_DYNAMIC, or HIGHLY_DYNAMIC.
 * Only SEMI_DYNAMIC and HIGHLY_DYNAMIC claims enter the Tavily evidence pipeline.
 * STATIC claims receive a default freshness score of 100.
 */
async function classifyTimeSensitivity(claims, sessionId) {
    if (claims.length === 0)
        return [];
    logger_1.logger.info('Classifying time sensitivity for claims', {
        count: claims.length,
        sessionId,
    });
    const prompt = (0, timeSensitivityPrompt_1.buildTimeSensitivityPrompt)(claims.map((c) => ({ claimText: c.claimText, order: c.order })));
    const result = await (0, bifrostClient_1.bifrostChatJson)({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        maxTokens: 1024,
        sessionId,
        stage: 'TIME_SENSITIVITY',
    }, timeSensitivityResponseSchema);
    // Map back to original claims by order, with fallback to SEMI_DYNAMIC if missing
    const classificationMap = new Map(result.classifications.map((c) => [c.order, c]));
    return claims.map((claim) => {
        const classification = classificationMap.get(claim.order);
        return {
            ...claim,
            timeSensitivity: classification?.timeSensitivity ?? 'SEMI_DYNAMIC',
            reasoning: classification?.reasoning ?? 'Defaulted to SEMI_DYNAMIC',
        };
    });
}
//# sourceMappingURL=timeSensitivityService.js.map