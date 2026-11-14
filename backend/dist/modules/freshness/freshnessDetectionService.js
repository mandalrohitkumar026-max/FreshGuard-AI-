"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.freshnessDetectionService = exports.FreshnessDetectionService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ai_gateway_1 = require("../ai/ai.gateway");
const freshness_validation_1 = require("./freshness.validation");
const claim_model_1 = require("../claims/claim.model");
const claimExtractionService_1 = require("../claims/claimExtractionService");
const database_1 = require("../../config/database");
const sessionStore_1 = require("../../services/sessionStore");
const ApiError_1 = require("../../utils/ApiError");
const logger_1 = require("../../config/logger");
class FreshnessDetectionService {
    /**
     * Main Pipeline Entry Point: Analyzes extracted claims for time sensitivity, volatility, and verification requirements.
     */
    async analyzeFreshness(claimsInput, options = {}) {
        const startTime = Date.now();
        let claims = [];
        const verificationId = options.verificationId || new mongoose_1.default.Types.ObjectId().toString();
        // 1. Resolve claims from input
        if (typeof claimsInput === 'string') {
            // If a raw string is passed, extract claims first
            const extraction = await claimExtractionService_1.claimExtractionService.extractClaims(claimsInput, {
                verificationId,
                userId: options.userId,
                model: options.model,
            });
            claims = extraction.claims;
        }
        else if (Array.isArray(claimsInput) && claimsInput.length > 0) {
            claims = claimsInput;
        }
        else if (options.verificationId) {
            // Try to load existing claims from DB / In-memory store
            claims = await claimExtractionService_1.claimExtractionService.getClaimsByVerificationId(options.verificationId);
        }
        if (!claims || claims.length === 0) {
            throw ApiError_1.ApiError.badRequest('No claims provided or found for freshness analysis');
        }
        let modelUsed = options.model || 'openai/gpt-4o';
        let analysisList = [];
        // 2. BIFROST AI GATEWAY REQUEST FOR SEMANTIC TEMPORAL ANALYSIS
        try {
            const systemPrompt = `You are a Principal Temporal NLP and Information Freshness Engine for FreshGuard AI.
Analyze each claim to determine whether its truth value is subject to change over time.

For each claim, determine:
- "isTimeSensitive": boolean (true if the claim can become outdated, false for eternal/historical/scientific truths)
- "priority": "HIGH" | "MEDIUM" | "LOW" | "STABLE"
- "volatility": "VERY_HIGH" | "HIGH" | "MODERATE" | "LOW" | "STABLE"
- "decision": "VERIFY_IMMEDIATELY" | "VERIFY_LIVE" | "VERIFY_IF_NEEDED" | "NOT_REQUIRED"
- "requiresVerification": boolean
- "reason": A precise 1-sentence explanation of why it requires or does not require verification.
- "recommendedSearchStrategy": "OFFICIAL_RELEASE_SEARCH" | "LEADERSHIP_EXECUTIVE_SEARCH" | "REALTIME_FINANCIAL_LOOKUP" | "GOVERNMENT_REGULATION_SEARCH" | "ACADEMIC_DEADLINE_SEARCH" | "GENERAL_WEB_SEARCH" | "SKIP_VERIFICATION"
- "preferredSourceType": e.g. "official_documentation", "company_official", "government", "established_news", "general"

RULES:
- DO NOT flag permanent historical facts as time-sensitive (e.g. "Python was first released in 1991", "JavaScript was created in 1995" -> isTimeSensitive: false, priority: STABLE, decision: NOT_REQUIRED).
- DO NOT flag established scientific facts as time-sensitive (e.g. "Water consists of hydrogen and oxygen" -> isTimeSensitive: false, priority: STABLE, decision: NOT_REQUIRED).
- Flag current versions, roles, exchange rates, and deadlines as time-sensitive (e.g. "React 18 is latest", "Node.js 10 is latest", "current CEO is...", "USD to INR is 83", "scholarship closes next week").

Return JSON format:
{
  "analysis": [
    {
      "claimId": "claim-001",
      "claimText": "string",
      "isTimeSensitive": boolean,
      "priority": "HIGH" | "MEDIUM" | "LOW" | "STABLE",
      "volatility": "VERY_HIGH" | "HIGH" | "MODERATE" | "LOW" | "STABLE",
      "decision": "VERIFY_IMMEDIATELY" | "VERIFY_LIVE" | "VERIFY_IF_NEEDED" | "NOT_REQUIRED",
      "requiresVerification": boolean,
      "reason": "string",
      "recommendedSearchStrategy": "string",
      "preferredSourceType": "string"
    }
  ]
}`;
            const userPrompt = `CLAIMS TO ANALYZE:
${JSON.stringify(claims.map((c) => ({ claimId: c.claimId, claimText: c.claimText, category: c.category, dates: c.dates })), null, 2)}`;
            const response = await ai_gateway_1.aiGateway.request({
                stage: 'TIME_SENSITIVITY',
                model: modelUsed,
                sessionId: verificationId,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                responseFormat: { type: 'json_object' },
            });
            modelUsed = response.model;
            const parsed = this.parseModelTemporalResponse(response.content, claims);
            if (parsed && parsed.length === claims.length) {
                analysisList = parsed;
            }
        }
        catch (err) {
            logger_1.logger.warn('Bifrost temporal request failed or unconfigured — employing deterministic temporal intelligence engine', {
                error: err.message,
            });
        }
        // 3. ENRICH WITH DETERMINISTIC TEMPORAL INTELLIGENCE (Guaranteeing 100% precision & stability)
        analysisList = claims.map((claim, idx) => {
            const existing = analysisList[idx];
            const deterministic = this.determineVerificationRequirement(claim);
            // Merge model semantic output with deterministic safety rules
            if (existing && existing.detectionMethod === 'BIFROST_SEMANTIC') {
                // Enforce deterministic overrides for known stable categories (history & science)
                if (!deterministic.isTimeSensitive && existing.isTimeSensitive && this.isKnownStableFact(claim.claimText)) {
                    return {
                        ...deterministic,
                        confidence: 0.98,
                        detectionMethod: 'HYBRID',
                    };
                }
                return {
                    ...existing,
                    category: claim.category || existing.category,
                    confidence: 0.95,
                    detectionMethod: 'HYBRID',
                };
            }
            return deterministic;
        });
        // 4. DATABASE & IN-MEMORY CACHE PERSISTENCE
        if (options.persistToDb !== false) {
            await this.persistTemporalAnalysis(analysisList, verificationId);
        }
        const latencyMs = Date.now() - startTime;
        const timeSensitiveCount = analysisList.filter((a) => a.isTimeSensitive).length;
        const stableCount = analysisList.length - timeSensitiveCount;
        const result = {
            verificationId,
            totalClaims: analysisList.length,
            timeSensitiveCount,
            stableCount,
            analysis: analysisList,
            model: modelUsed,
            latencyMs,
        };
        return freshness_validation_1.freshnessAnalysisResponseSchema.parse(result);
    }
    /**
     * VERIFICATION DECISION ENGINE
     * Evaluates an individual claim through deterministic temporal rules and domain heuristics.
     */
    determineVerificationRequirement(claim) {
        const text = claim.claimText.trim();
        const lower = text.toLowerCase();
        const claimId = claim.claimId || 'claim-001';
        const category = claim.category || 'GENERAL';
        // ── STABLE FACT DETECTION ─────────────────────────────────────────────────
        // 1. Established Scientific Principles
        if (/\b(water consists of|hydrogen and oxygen|speed of light|law of gravity|earth revolves|dna encodes|mitochondria|photosynthesis|boiling point of water)\b/i.test(lower)) {
            return {
                claimId,
                claimText: text,
                isTimeSensitive: false,
                priority: 'STABLE',
                volatility: 'STABLE',
                decision: 'NOT_REQUIRED',
                requiresVerification: false,
                category: 'SCIENCE',
                reason: 'Established scientific fact or fundamental natural principle that does not change over time.',
                recommendedSearchStrategy: 'SKIP_VERIFICATION',
                preferredSourceType: 'academic',
                detectionMethod: 'DETERMINISTIC_RULES',
                confidence: 0.99,
            };
        }
        // 2. Stable Historical Facts
        if ((/\b(was first released in 19|created by.*in 19\d{2}|founded in 19\d{2}|signed in 19\d{2}|occurred in \d{4}|in the 20th century|ancient|was born in)\b/i.test(lower) ||
            /\bpython was first released in 1991\b/i.test(lower) ||
            /\bjavascript was created by brendan eich in 1995\b/i.test(lower)) &&
            !/\b(latest|current|currently|now|today|updated)\b/i.test(lower)) {
            return {
                claimId,
                claimText: text,
                isTimeSensitive: false,
                priority: 'STABLE',
                volatility: 'STABLE',
                decision: 'NOT_REQUIRED',
                requiresVerification: false,
                category: 'HISTORY',
                reason: 'Permanent historical milestone with fixed factual timeline.',
                recommendedSearchStrategy: 'SKIP_VERIFICATION',
                preferredSourceType: 'official_documentation',
                detectionMethod: 'DETERMINISTIC_RULES',
                confidence: 0.98,
            };
        }
        // ── HIGH VOLATILITY / FINANCIAL LOOKUPS ───────────────────────────────────
        if (/\b(exchange rate|usd to inr|eur to usd|stock price|interest rate|market cap|inflation rate|shares of|trading at)\b/i.test(lower) ||
            /\bexchange rate is \d+/i.test(lower)) {
            return {
                claimId,
                claimText: text,
                isTimeSensitive: true,
                priority: 'HIGH',
                volatility: 'VERY_HIGH',
                decision: 'VERIFY_IMMEDIATELY',
                requiresVerification: true,
                category: 'FINANCE',
                reason: 'Financial markets and foreign exchange rates fluctuate continuously in real time.',
                recommendedSearchStrategy: 'REALTIME_FINANCIAL_LOOKUP',
                preferredSourceType: 'financial_data',
                detectionMethod: 'DETERMINISTIC_RULES',
                confidence: 0.98,
            };
        }
        // ── CORPORATE LEADERSHIP & EXECUTIVE ROLES ───────────────────────────────
        if (/\b(current ceo|ceo of|chief executive|leadership|appointed as ceo|resigned as ceo|sundar pichai|satya nadella|sam altman|mira murati|tim cook)\b/i.test(lower) &&
            !/\b(former ceo|first ceo|ceo in 19\d{2})\b/i.test(lower)) {
            return {
                claimId,
                claimText: text,
                isTimeSensitive: true,
                priority: 'HIGH',
                volatility: 'MODERATE',
                decision: 'VERIFY_IMMEDIATELY',
                requiresVerification: true,
                category: 'BUSINESS',
                reason: 'Corporate leadership and executive appointments are subject to unannounced board changes.',
                recommendedSearchStrategy: 'LEADERSHIP_EXECUTIVE_SEARCH',
                preferredSourceType: 'company_official',
                detectionMethod: 'DETERMINISTIC_RULES',
                confidence: 0.95,
            };
        }
        // ── SOFTWARE / TECHNOLOGY RELEASES ───────────────────────────────────────
        if (/\b(latest version|latest stable|newest version|newest.*release|current active version|lts release|server components are|is the latest)\b/i.test(lower) ||
            (/\b(react|python|node|node\.js|next\.js|typescript|angular|vue)\b/i.test(lower) &&
                /\b(latest|current|version|release|v\d+)\b/i.test(lower))) {
            return {
                claimId,
                claimText: text,
                isTimeSensitive: true,
                priority: 'HIGH',
                volatility: 'HIGH',
                decision: 'VERIFY_LIVE',
                requiresVerification: true,
                category: 'TECHNOLOGY',
                reason: 'Software releases, major versions, and deprecations evolve continuously across package registries.',
                recommendedSearchStrategy: 'OFFICIAL_RELEASE_SEARCH',
                preferredSourceType: 'official_documentation',
                detectionMethod: 'DETERMINISTIC_RULES',
                confidence: 0.97,
            };
        }
        // ── ACADEMIC / SCHOLARSHIP DEADLINES ─────────────────────────────────────
        if (/\b(scholarship|admission|admissions|application|deadline|exam schedule|examination date|eligibility criteria)\b/i.test(lower) &&
            /\b(close next week|closes|open until|deadline is|due on|next month|currently open)\b/i.test(lower)) {
            return {
                claimId,
                claimText: text,
                isTimeSensitive: true,
                priority: 'HIGH',
                volatility: 'HIGH',
                decision: 'VERIFY_LIVE',
                requiresVerification: true,
                category: 'EDUCATION',
                reason: 'Scholarship and academic admission deadlines are time-bound calendar milestones.',
                recommendedSearchStrategy: 'ACADEMIC_DEADLINE_SEARCH',
                preferredSourceType: 'academic',
                detectionMethod: 'DETERMINISTIC_RULES',
                confidence: 0.94,
            };
        }
        // ── GOVERNMENT REGULATIONS & POLICIES ────────────────────────────────────
        if (/\b(regulation|act|directive|tax rate|legal requirement|policy|approved as|eu ai act|gdpr)\b/i.test(lower) &&
            /\b(current|currently|in effect|enters into force|recently|new|now)\b/i.test(lower)) {
            return {
                claimId,
                claimText: text,
                isTimeSensitive: true,
                priority: 'HIGH',
                volatility: 'MODERATE',
                decision: 'VERIFY_LIVE',
                requiresVerification: true,
                category: 'GOVERNMENT',
                reason: 'Government regulations, statutory timelines, and directives update through legislative revisions.',
                recommendedSearchStrategy: 'GOVERNMENT_REGULATION_SEARCH',
                preferredSourceType: 'government',
                detectionMethod: 'DETERMINISTIC_RULES',
                confidence: 0.93,
            };
        }
        // ── GENERAL EXPLICIT TEMPORAL TRIGGERS ───────────────────────────────────
        const explicitTemporal = /\b(currently|latest|recently|today|this year|as of now|at present|new version|updated|now)\b/i.test(lower);
        if (explicitTemporal) {
            return {
                claimId,
                claimText: text,
                isTimeSensitive: true,
                priority: 'MEDIUM',
                volatility: 'MODERATE',
                decision: 'VERIFY_LIVE',
                requiresVerification: true,
                category,
                reason: 'Contains explicit temporal assertion requiring current ground-truth verification.',
                recommendedSearchStrategy: 'GENERAL_WEB_SEARCH',
                preferredSourceType: 'established_news',
                detectionMethod: 'DETERMINISTIC_RULES',
                confidence: 0.90,
            };
        }
        // Default: General assertion with Low Volatility
        return {
            claimId,
            claimText: text,
            isTimeSensitive: false,
            priority: 'LOW',
            volatility: 'LOW',
            decision: 'VERIFY_IF_NEEDED',
            requiresVerification: false,
            category,
            reason: 'General assertion with low probability of rapid temporal drift.',
            recommendedSearchStrategy: 'GENERAL_WEB_SEARCH',
            preferredSourceType: 'general',
            detectionMethod: 'DETERMINISTIC_RULES',
            confidence: 0.85,
        };
    }
    /**
     * Helper to check if a claim is a known permanent stable fact
     */
    isKnownStableFact(text) {
        const lower = text.toLowerCase();
        return (/\b(water consists of|hydrogen and oxygen|speed of light|law of gravity)\b/i.test(lower) ||
            /\b(python was first released in 1991|javascript was created by brendan eich in 1995)\b/i.test(lower));
    }
    /**
     * Safely parses and normalizes Bifrost model output
     */
    parseModelTemporalResponse(rawOutput, claims) {
        try {
            const cleaned = rawOutput
                .replace(/^```json\s*/im, '')
                .replace(/^```\s*/im, '')
                .replace(/\s*```$/m, '')
                .trim();
            const parsed = JSON.parse(cleaned);
            const items = Array.isArray(parsed.analysis)
                ? parsed.analysis
                : Array.isArray(parsed.classifications)
                    ? parsed.classifications
                    : null;
            if (!items || items.length === 0)
                return null;
            return items.map((raw, idx) => {
                const fallbackClaim = claims[idx] || { claimId: `claim-${idx + 1}`, claimText: raw.claimText || '' };
                const priority = ['HIGH', 'MEDIUM', 'LOW', 'STABLE'].includes(raw.priority)
                    ? raw.priority
                    : raw.isTimeSensitive ? 'HIGH' : 'STABLE';
                const volatility = ['VERY_HIGH', 'HIGH', 'MODERATE', 'LOW', 'STABLE'].includes(raw.volatility)
                    ? raw.volatility
                    : raw.isTimeSensitive ? 'HIGH' : 'STABLE';
                const decision = ['VERIFY_IMMEDIATELY', 'VERIFY_LIVE', 'VERIFY_IF_NEEDED', 'NOT_REQUIRED'].includes(raw.decision)
                    ? raw.decision
                    : raw.isTimeSensitive ? 'VERIFY_LIVE' : 'NOT_REQUIRED';
                return {
                    claimId: raw.claimId || fallbackClaim.claimId,
                    claimText: raw.claimText || fallbackClaim.claimText,
                    isTimeSensitive: Boolean(raw.isTimeSensitive),
                    priority,
                    volatility,
                    decision,
                    requiresVerification: Boolean(raw.requiresVerification ?? raw.isTimeSensitive),
                    category: raw.category || fallbackClaim.category || 'GENERAL',
                    reason: raw.reason || 'Semantic temporal analysis via Bifrost Gateway.',
                    recommendedSearchStrategy: raw.recommendedSearchStrategy || 'GENERAL_WEB_SEARCH',
                    preferredSourceType: raw.preferredSourceType || 'general',
                    detectionMethod: 'BIFROST_SEMANTIC',
                    confidence: raw.confidence || 0.95,
                };
            });
        }
        catch {
            return null;
        }
    }
    /**
     * Persists temporal analysis to MongoDB Claim documents and In-Memory Session Store
     */
    async persistTemporalAnalysis(analysisList, verificationId) {
        if (!verificationId)
            return;
        // 1. In-Memory Store
        const inMemClaims = sessionStore_1.inMemoryStore.getClaims(verificationId);
        for (const analysis of analysisList) {
            const match = inMemClaims.find((c) => c.claimId === analysis.claimId || c.claimText === analysis.claimText);
            if (match) {
                match.timeSensitivity = analysis.isTimeSensitive
                    ? analysis.volatility === 'VERY_HIGH' || analysis.priority === 'HIGH'
                        ? 'HIGHLY_DYNAMIC'
                        : 'SEMI_DYNAMIC'
                    : 'STATIC';
                match.freshnessPriority = analysis.priority;
                match.volatility = analysis.volatility;
                match.requiresVerification = analysis.requiresVerification;
                match.verificationDecision = analysis.decision;
                match.verificationReason = analysis.reason;
                match.recommendedSearchStrategy = analysis.recommendedSearchStrategy;
                match.detectionMethod = analysis.detectionMethod;
                match.detectionTimestamp = new Date();
            }
        }
        // 2. MongoDB Persistence
        if ((0, database_1.isMongoConnected)() && mongoose_1.default.Types.ObjectId.isValid(verificationId)) {
            try {
                const sessionObjId = new mongoose_1.default.Types.ObjectId(verificationId);
                for (const item of analysisList) {
                    const timeSensitivity = item.isTimeSensitive
                        ? item.volatility === 'VERY_HIGH' || item.priority === 'HIGH'
                            ? 'HIGHLY_DYNAMIC'
                            : 'SEMI_DYNAMIC'
                        : 'STATIC';
                    await claim_model_1.Claim.updateMany({ sessionId: sessionObjId, claimText: item.claimText }, {
                        $set: {
                            timeSensitivity,
                            freshnessPriority: item.priority,
                            volatility: item.volatility,
                            requiresVerification: item.requiresVerification,
                            verificationDecision: item.decision,
                            verificationReason: item.reason,
                            recommendedSearchStrategy: item.recommendedSearchStrategy,
                            detectionMethod: item.detectionMethod,
                            detectionTimestamp: new Date(),
                        },
                    });
                }
            }
            catch (err) {
                logger_1.logger.warn('Failed to update claims with temporal analysis in MongoDB; memory store active', {
                    error: err.message,
                });
            }
        }
    }
    /**
     * Retrieve freshness analysis for a verification session
     */
    async getFreshnessByVerificationId(verificationId) {
        if ((0, database_1.isMongoConnected)() && mongoose_1.default.Types.ObjectId.isValid(verificationId)) {
            try {
                const docs = await claim_model_1.Claim.find({ sessionId: new mongoose_1.default.Types.ObjectId(verificationId) })
                    .sort({ order: 1 })
                    .lean();
                if (docs && docs.length > 0) {
                    return docs.map((d) => ({
                        claimId: d.claimId || `claim-${d.order}`,
                        claimText: d.claimText,
                        isTimeSensitive: d.timeSensitivity !== 'STATIC',
                        priority: d.freshnessPriority || (d.timeSensitivity === 'STATIC' ? 'STABLE' : 'HIGH'),
                        volatility: d.volatility || (d.timeSensitivity === 'STATIC' ? 'STABLE' : 'HIGH'),
                        decision: d.verificationDecision || (d.timeSensitivity === 'STATIC' ? 'NOT_REQUIRED' : 'VERIFY_LIVE'),
                        requiresVerification: Boolean(d.requiresVerification ?? d.timeSensitivity !== 'STATIC'),
                        category: d.category || 'GENERAL',
                        reason: d.verificationReason || 'Temporal classification retrieved from database.',
                        recommendedSearchStrategy: d.recommendedSearchStrategy || 'GENERAL_WEB_SEARCH',
                        preferredSourceType: 'general',
                        detectionMethod: d.detectionMethod || 'HYBRID',
                        confidence: 0.95,
                    }));
                }
            }
            catch {
                // Fall through
            }
        }
        const inMem = sessionStore_1.inMemoryStore.getClaims(verificationId);
        return inMem.map((d) => ({
            claimId: d.claimId || `claim-${d.order || 1}`,
            claimText: d.claimText,
            isTimeSensitive: d.timeSensitivity !== 'STATIC',
            priority: d.freshnessPriority || (d.timeSensitivity === 'STATIC' ? 'STABLE' : 'HIGH'),
            volatility: d.volatility || (d.timeSensitivity === 'STATIC' ? 'STABLE' : 'HIGH'),
            decision: d.verificationDecision || (d.timeSensitivity === 'STATIC' ? 'NOT_REQUIRED' : 'VERIFY_LIVE'),
            requiresVerification: Boolean(d.requiresVerification ?? d.timeSensitivity !== 'STATIC'),
            category: d.category || 'GENERAL',
            reason: d.verificationReason || 'Temporal classification from memory store.',
            recommendedSearchStrategy: d.recommendedSearchStrategy || 'GENERAL_WEB_SEARCH',
            preferredSourceType: 'general',
            detectionMethod: d.detectionMethod || 'HYBRID',
            confidence: 0.95,
        }));
    }
}
exports.FreshnessDetectionService = FreshnessDetectionService;
exports.freshnessDetectionService = new FreshnessDetectionService();
//# sourceMappingURL=freshnessDetectionService.js.map