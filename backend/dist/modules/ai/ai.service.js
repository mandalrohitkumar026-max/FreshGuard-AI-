"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const ai_gateway_1 = require("./ai.gateway");
const ai_validation_1 = require("./ai.validation");
const ApiError_1 = require("../../utils/ApiError");
const logger_1 = require("../../config/logger");
class AIService {
    /**
     * Helper to clean JSON string from LLM responses (stripping markdown fences)
     */
    cleanJson(raw) {
        const cleaned = raw
            .replace(/^```json\s*/im, '')
            .replace(/^```\s*/im, '')
            .replace(/\s*```$/m, '')
            .trim();
        try {
            return JSON.parse(cleaned);
        }
        catch (parseErr) {
            // Try to find the first JSON object or array in the string
            const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                }
                catch {
                    // Fall through
                }
            }
            logger_1.logger.error('Failed to parse AI response as JSON', { raw, error: parseErr.message });
            throw ApiError_1.ApiError.badRequest('Model returned invalid or unparseable JSON output');
        }
    }
    /**
     * FUNCTION 1: CLAIM EXTRACTION
     * Extracts discrete verifiable factual claims from an AI-generated answer.
     */
    async extractClaims(answerText, topicHint, model) {
        const systemPrompt = `You are a precision factual claim extractor for FreshGuard AI.
Extract all discrete, falsifiable factual claims from the provided answer.
For each claim:
- "claimText": A self-contained, atomic declarative statement.
- "category": Type of claim (e.g. technology, leadership, release_date, policy, scientific).
- "timeSensitive": true if the claim depends on time (e.g. current status, versions, roles), false for static truths.
- "reason": Explanation of why it is or is not time-sensitive.

Return ONLY a JSON object matching this schema:
{
  "claims": [
    {
      "claimText": "string",
      "category": "string",
      "timeSensitive": boolean,
      "reason": "string"
    }
  ]
}`;
        const userPrompt = `TOPIC: ${topicHint || 'General'}\n\nANSWER TO ANALYZE:\n${answerText}`;
        const response = await ai_gateway_1.aiGateway.request({
            model,
            stage: 'CLAIM_EXTRACTION',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            responseFormat: { type: 'json_object' },
        });
        const parsedJson = this.cleanJson(response.content);
        const validated = ai_validation_1.claimExtractionResponseSchema.parse(parsedJson);
        return {
            result: validated,
            meta: {
                latencyMs: response.latencyMs,
                usage: response.usage,
                model: response.model,
            },
        };
    }
    /**
     * FUNCTION 2: TIME-SENSITIVITY ANALYSIS
     * Analyzes the time sensitivity and volatility of extracted claims.
     */
    async analyzeTimeSensitivity(claims, model) {
        const systemPrompt = `You are an AI temporal freshness classifier.
Classify each claim's time sensitivity into:
- STATIC: Never changes (e.g., historical dates, mathematical laws, foundational scientific facts).
- SEMI_DYNAMIC: Changes periodically over months/years (e.g., software major versions, current CEO, active laws).
- HIGHLY_DYNAMIC: Changes rapidly over days/weeks (e.g., stock prices, current weather, trending events).

Return ONLY a JSON object matching this schema:
{
  "classifications": [
    {
      "claimText": "string",
      "timeSensitivity": "STATIC" | "SEMI_DYNAMIC" | "HIGHLY_DYNAMIC",
      "reason": "string",
      "changeLikelihood": "LOW" | "MEDIUM" | "HIGH"
    }
  ]
}`;
        const userPrompt = `CLAIMS TO CLASSIFY:\n${claims.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
        const response = await ai_gateway_1.aiGateway.request({
            model,
            stage: 'TIME_SENSITIVITY',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            responseFormat: { type: 'json_object' },
        });
        const parsedJson = this.cleanJson(response.content);
        const validated = ai_validation_1.timeSensitivityResponseSchema.parse(parsedJson);
        return {
            result: validated,
            meta: {
                latencyMs: response.latencyMs,
                usage: response.usage,
                model: response.model,
            },
        };
    }
    /**
     * FUNCTION 3: EVIDENCE ANALYSIS
     * Compares a claim against retrieved web evidence to determine verdict and confidence.
     */
    async analyzeEvidence(claimText, evidenceItems, model) {
        const systemPrompt = `You are an objective AI factual evidence validator.
Compare the claim against the provided retrieved evidence.
Determine:
- "verdict": "CONFIRMS" | "CONTRADICTS" | "PARTIALLY_CONTRADICTS" | "INSUFFICIENT"
- "confidence": number between 0 and 1
- "supportingStatements": list of quotes/facts from evidence that support the claim
- "contradictions": list of facts from evidence that contradict or update the claim
- "explanation": concise synthesis of why the verdict was reached

Return ONLY a JSON object matching this schema:
{
  "verdict": "CONFIRMS" | "CONTRADICTS" | "PARTIALLY_CONTRADICTS" | "INSUFFICIENT",
  "confidence": number,
  "supportingStatements": string[],
  "contradictions": string[],
  "explanation": "string"
}`;
        const evidenceText = evidenceItems
            .map((e, i) => `[Source ${i + 1}]: ${e.title || 'Web Result'} (${e.url || 'No URL'})\nPublished: ${e.publishedDate || 'Unknown'}\nExcerpt: ${e.content}`)
            .join('\n\n');
        const userPrompt = `CLAIM TO VERIFY:\n"${claimText}"\n\nRETRIEVED LIVE EVIDENCE:\n${evidenceText}`;
        const response = await ai_gateway_1.aiGateway.request({
            model,
            stage: 'EVIDENCE_ANALYSIS',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            responseFormat: { type: 'json_object' },
        });
        const parsedJson = this.cleanJson(response.content);
        const validated = ai_validation_1.evidenceAnalysisResponseSchema.parse(parsedJson);
        return {
            result: {
                claimText,
                ...validated,
            },
            meta: {
                latencyMs: response.latencyMs,
                usage: response.usage,
                model: response.model,
            },
        };
    }
    /**
     * FUNCTION 4: CORRECTED ANSWER GENERATION
     * Rewrites an answer to fix outdated or contradictory claims while preserving supported content.
     */
    async generateCorrection(originalAnswer, claims, model) {
        const systemPrompt = `You are a precision factual AI editor.
Review the original answer and the verified claims with their verdicts and evidence.
Rules:
- Preserve all facts and sentences that are confirmed or supported.
- Correct ONLY claims that were identified as CONTRADICTS or PARTIALLY_CONTRADICTS.
- Include concise markdown citations to the authoritative sources.
- Never add speculation.

Return ONLY a JSON object matching this schema:
{
  "hasModifications": boolean,
  "correctedAnswer": "string",
  "changeExplanation": "string",
  "confidence": number
}`;
        const claimsContext = claims
            .map((c, idx) => `${idx + 1}. Claim: "${c.claimText}"\n   Verdict: ${c.verdict}\n   Note: ${c.explanation || 'None'}`)
            .join('\n');
        const userPrompt = `ORIGINAL ANSWER:\n${originalAnswer}\n\nVERIFIED CLAIMS ASSESSMENT:\n${claimsContext}`;
        const response = await ai_gateway_1.aiGateway.request({
            model,
            stage: 'CORRECTION',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            responseFormat: { type: 'json_object' },
        });
        const parsedJson = this.cleanJson(response.content);
        const validated = ai_validation_1.correctionResponseSchema.parse(parsedJson);
        return {
            result: {
                originalAnswer,
                ...validated,
            },
            meta: {
                latencyMs: response.latencyMs,
                usage: response.usage,
                model: response.model,
            },
        };
    }
}
exports.AIService = AIService;
exports.aiService = new AIService();
//# sourceMappingURL=ai.service.js.map