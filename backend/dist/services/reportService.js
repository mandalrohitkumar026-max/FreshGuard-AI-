"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assembleReport = assembleReport;
const mongoose_1 = __importDefault(require("mongoose"));
const Report_1 = require("../models/Report");
const sessionStore_1 = require("./sessionStore");
/**
 * Report Service (Pipeline Stage 12)
 *
 * Assembles the final verification report document.
 * Supports both MongoDB and inMemoryStore fallback.
 */
async function assembleReport(input) {
    const { sessionId, userId, originalAnswer, correctedAnswer, correctionExplanation, scoredClaims, aggregateFreshnessScore, riskLevel, stats, processingTimeMs, } = input;
    const freshClaims = scoredClaims.filter((c) => c.freshnessScore >= 80).length;
    const staleClaims = stats.staleClaims;
    const claimSummaries = scoredClaims.map((claim) => {
        const topSource = claim.evidence
            .filter((e) => e.usedInAnalysis)
            .sort((a, b) => b.authorityScore - a.authorityScore)[0];
        return {
            claimId: new mongoose_1.default.Types.ObjectId().toString(),
            claimText: claim.claimText,
            freshnessScore: claim.freshnessScore,
            verdict: claim.verdict,
            confidence: claim.confidence,
            explanation: claim.explanation,
            topSourceUrl: topSource?.url,
            topSourceDomain: topSource?.domain,
        };
    });
    // Deduplicate sources
    const allSources = scoredClaims.flatMap((c) => c.evidence
        .filter((e) => e.usedInAnalysis && e.authorityTier !== 'UNKNOWN')
        .map((e) => ({
        url: e.url,
        title: e.title,
        domain: e.domain,
        authorityTier: e.authorityTier,
        authorityScore: e.authorityScore,
    })));
    const sourceMap = new Map();
    for (const source of allSources) {
        const existing = sourceMap.get(source.domain);
        if (!existing || source.authorityScore > existing.authorityScore) {
            sourceMap.set(source.domain, source);
        }
    }
    const topSources = Array.from(sourceMap.values())
        .sort((a, b) => b.authorityScore - a.authorityScore)
        .slice(0, 10)
        .map(({ url, title, domain, authorityTier }) => ({ url, title, domain, authorityTier }));
    const reportData = {
        sessionId,
        userId,
        originalAnswer,
        suggestedAnswer: correctedAnswer,
        correctedAnswer,
        hasCorrectedAnswer: !!correctedAnswer,
        correctionExplanation,
        summary: {
            aggregateFreshnessScore,
            riskLevel,
            totalClaims: stats.totalClaims,
            staleClaims,
            supportedClaims: freshClaims,
            freshClaims,
            unverifiedClaims: stats.unverifiableClaims,
            processingTimeMs,
            modelUsed: 'Bifrost Model Gateway (Maxim AI)',
        },
        claims: scoredClaims.map((c, i) => ({
            id: `cl-${i + 1}`,
            order: c.order,
            claimText: c.claimText,
            category: c.timeSensitivity || 'SOFTWARE_RELEASE',
            timeSensitivity: c.timeSensitivity,
            verdict: c.verdict,
            confidence: c.confidence,
            freshnessScore: c.freshnessScore,
            explanation: c.explanation,
            searchQuery: c.searchQuery,
            evidence: c.evidence.map((e) => ({
                url: e.url,
                title: e.title,
                domain: e.domain,
                authorityTier: e.authorityTier,
                authorityScore: e.authorityScore,
                tavilyScore: e.tavilyScore,
                ageInDays: e.ageInDays,
                publishedDate: e.publishedDate ? new Date(e.publishedDate).toISOString().split('T')[0] : null,
                retrievedAt: new Date().toISOString(),
                snippet: e.content,
                usedInAnalysis: e.usedInAnalysis,
            })),
        })),
        claimSummaries,
        topSources,
        isPublic: false,
        createdAt: new Date(),
    };
    if ((0, sessionStore_1.isMongoConnected)()) {
        try {
            const report = await Report_1.Report.create(reportData);
            return report;
        }
        catch {
            return sessionStore_1.inMemoryStore.saveReport(reportData);
        }
    }
    return sessionStore_1.inMemoryStore.saveReport(reportData);
}
//# sourceMappingURL=reportService.js.map