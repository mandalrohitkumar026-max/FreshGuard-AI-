"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndScoreEvidence = validateAndScoreEvidence;
exports.findBestEvidence = findBestEvidence;
exports.logEvidenceSummary = logEvidenceSummary;
const domainAuthority_1 = require("../utils/domainAuthority");
const dateUtils_1 = require("../utils/dateUtils");
const logger_1 = require("../utils/logger");
/**
 * Evidence Validator Service (Pipeline Stage 7)
 *
 * Transforms raw Tavily results into validated, scored evidence items.
 *
 * Scoring is 100% deterministic — no AI involved:
 * - Domain authority tier from known allowlists
 * - Publication age from Tavily-provided date metadata
 * - Combined authority score: 60% domain tier + 40% Tavily relevance
 */
function validateAndScoreEvidence(results, timeSensitivity) {
    return results
        .map((result) => {
        const domain = (0, domainAuthority_1.extractDomain)(result.url);
        const { tier, score } = (0, domainAuthority_1.computeAuthorityScore)(result.url, result.score);
        const publishedDate = result.published_date
            ? new Date(result.published_date)
            : null;
        const ageInDays = (0, dateUtils_1.computeAgeInDays)(publishedDate);
        // Filter: very old evidence is unreliable for HIGHLY_DYNAMIC claims
        const usedInAnalysis = result.score >= 0.3 &&
            (timeSensitivity !== 'HIGHLY_DYNAMIC' || ageInDays === null || ageInDays <= 365);
        return {
            url: result.url,
            title: result.title,
            content: result.content.slice(0, 1500), // cap content length
            domain,
            tavilyScore: result.score,
            authorityTier: tier,
            authorityScore: score,
            publishedDate,
            ageInDays,
            usedInAnalysis,
        };
    })
        .sort((a, b) => {
        // Sort by: usedInAnalysis first, then by combined authority+recency
        if (a.usedInAnalysis !== b.usedInAnalysis) {
            return a.usedInAnalysis ? -1 : 1;
        }
        return b.authorityScore - a.authorityScore;
    });
}
/**
 * Find the best evidence item for scoring purposes.
 * "Best" = highest authority score among items used in analysis.
 */
function findBestEvidence(evidence) {
    const usable = evidence.filter((e) => e.usedInAnalysis);
    if (usable.length === 0)
        return null;
    return usable.reduce((best, curr) => curr.authorityScore > best.authorityScore ? curr : best);
}
function logEvidenceSummary(claimText, evidence) {
    logger_1.logger.debug('Evidence validated', {
        claim: claimText.slice(0, 60),
        total: evidence.length,
        usable: evidence.filter((e) => e.usedInAnalysis).length,
        topDomain: evidence[0]?.domain ?? 'none',
        topScore: evidence[0]?.tavilyScore ?? 0,
    });
}
//# sourceMappingURL=evidenceValidatorService.js.map