"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoringEngine = exports.ScoringEngine = void 0;
const scoring_config_1 = require("./scoring.config");
class ScoringEngine {
    config;
    constructor(config = scoring_config_1.DEFAULT_SCORING_CONFIG) {
        this.config = config;
    }
    /**
     * Evaluates the inherent temporal stability/volatility of a claim (0 - 100).
     */
    calculateTemporalRelevance(timeSensitivity, claimText) {
        if (timeSensitivity === 'STATIC') {
            return 100;
        }
        let base = timeSensitivity === 'SEMI_DYNAMIC' ? 75 : 50;
        // Temporal volatility keyword penalty for dynamic topics
        const hasFluidKeywords = /\b(currently|latest|current|newest|today|price|ceo|rate|version|population)\b/i.test(claimText);
        if (hasFluidKeywords && timeSensitivity === 'HIGHLY_DYNAMIC') {
            base = Math.max(35, base - 10);
        }
        return base;
    }
    /**
     * Evaluates evidence recency relative to volatility (0 - 100).
     * Stable historical facts never decay.
     */
    calculateEvidenceRecency(timeSensitivity, evidenceList) {
        if (timeSensitivity === 'STATIC') {
            return 100; // Historical/scientific invariants do not decay
        }
        if (!evidenceList || evidenceList.length === 0) {
            return 50;
        }
        // Find the most recently published date among supporting/relevant sources
        const validDates = evidenceList
            .filter((e) => e.publishedDate)
            .map((e) => new Date(e.publishedDate).getTime())
            .filter((t) => !isNaN(t));
        if (validDates.length === 0) {
            // Missing publication date metadata
            return 60;
        }
        const mostRecentTimestamp = Math.max(...validDates);
        const ageInDays = Math.max(0, (Date.now() - mostRecentTimestamp) / (1000 * 60 * 60 * 24));
        if (ageInDays <= 14)
            return 100;
        if (ageInDays <= 60)
            return 95;
        if (ageInDays <= 180)
            return 85;
        if (ageInDays <= 365)
            return 70;
        if (timeSensitivity === 'SEMI_DYNAMIC') {
            return Math.max(30, Math.round(100 - ageInDays * 0.08));
        }
        else {
            // Highly dynamic decays faster
            return Math.max(10, Math.round(100 - ageInDays * 0.18));
        }
    }
    /**
     * Evaluates evidence quality, authority tier, and corroboration (0 - 100).
     */
    calculateEvidenceQuality(evidenceList, timeSensitivity, status) {
        if (timeSensitivity === 'STATIC' && (!evidenceList || evidenceList.length === 0 || status === 'NOT_CHECKED')) {
            return 100; // Established historical/scientific invariant needs no external quality booster
        }
        if (!evidenceList || evidenceList.length === 0) {
            return 35;
        }
        // Sort by authority score
        const bestSource = [...evidenceList].sort((a, b) => (b.authorityScore || 0) - (a.authorityScore || 0))[0];
        const authorityScore = bestSource?.authorityScore ?? 0.7;
        const isPrimary = Boolean(bestSource?.sourceIntelligence?.isPrimarySource);
        const corroborations = bestSource?.sourceIntelligence?.corroborationCount || 0;
        let score = authorityScore * 50; // up to 50 pts
        score += isPrimary ? 30 : 15; // up to 30 pts
        score += Math.min(3, corroborations) * 8; // up to 24 pts
        return Math.min(100, Math.max(20, Math.round(score)));
    }
    /**
     * Evaluates verification cross-examination outcome (0 - 100).
     */
    calculateVerificationOutcome(status, verdict) {
        if (status === 'SUPPORTED' || status === 'NOT_CHECKED' || verdict === 'CONFIRMS') {
            return 100;
        }
        if (status === 'PARTIALLY_SUPPORTED' || verdict === 'PARTIALLY_CONTRADICTS') {
            return 50;
        }
        if (status === 'UNVERIFIED' || verdict === 'INSUFFICIENT') {
            return 40;
        }
        if (status === 'CONFLICTING') {
            return 30;
        }
        if (status === 'OUTDATED' || verdict === 'CONTRADICTS') {
            return 0;
        }
        return 40;
    }
    /**
     * Evaluates certainty and completeness of evidence (0 - 100).
     */
    calculateUncertainty(evidenceList, confidence, status, timeSensitivity) {
        if (timeSensitivity === 'STATIC' && (status === 'NOT_CHECKED' || status === 'SUPPORTED')) {
            return 100;
        }
        let certainty = Math.min(100, Math.max(20, Math.round((confidence || 0.8) * 100)));
        if (timeSensitivity !== 'STATIC') {
            const hasDate = evidenceList && evidenceList.some((e) => Boolean(e.publishedDate));
            if (!hasDate) {
                certainty = Math.max(15, certainty - 20); // Penalty for unknown publication date
            }
            if (!evidenceList || evidenceList.length < 2) {
                certainty = Math.max(15, certainty - 10);
            }
        }
        if (status === 'UNVERIFIED') {
            certainty = Math.max(15, certainty - 25);
        }
        return certainty;
    }
    /**
     * Computes the final claim freshness score from the 5 factors.
     */
    computeClaimScore(factors, status, verdict) {
        const w = this.config.weights;
        const raw = factors.temporalRelevance * w.temporalRelevance +
            factors.evidenceRecency * w.evidenceRecency +
            factors.evidenceQuality * w.evidenceQuality +
            factors.verificationOutcome * w.verificationOutcome +
            factors.uncertainty * w.uncertainty;
        let finalScore = Math.round(raw);
        // Hard bounds and caps based on empirical verdict
        if (status === 'OUTDATED' || verdict === 'CONTRADICTS') {
            finalScore = Math.min(finalScore, 24); // Capped at Severely Outdated (0 - 24)
        }
        else if (status === 'PARTIALLY_SUPPORTED' || verdict === 'PARTIALLY_CONTRADICTS') {
            finalScore = Math.min(Math.max(40, finalScore), 65);
        }
        else if (status === 'CONFLICTING') {
            finalScore = Math.min(Math.max(30, finalScore), 55);
        }
        else if (status === 'UNVERIFIED' || verdict === 'INSUFFICIENT') {
            finalScore = Math.min(Math.max(25, finalScore), 50);
        }
        else if (status === 'SUPPORTED' || status === 'NOT_CHECKED') {
            finalScore = Math.max(75, Math.min(100, finalScore));
        }
        return Math.max(0, Math.min(100, finalScore));
    }
    /**
     * Interprets score against configurable canonical thresholds.
     */
    interpretScore(score) {
        const t = this.config.thresholds;
        if (score >= t.veryFresh)
            return 'VERY_FRESH';
        if (score >= t.fresh)
            return 'FRESH';
        if (score >= t.needsReview)
            return 'NEEDS_REVIEW';
        if (score >= t.potentiallyOutdated)
            return 'POTENTIALLY_OUTDATED';
        return 'SEVERELY_OUTDATED';
    }
    /**
     * Computes weighted aggregate freshness for the entire answer.
     */
    computeOverallScore(scoredClaims) {
        if (!scoredClaims || scoredClaims.length === 0) {
            return 100;
        }
        let weightedSum = 0;
        let totalWeight = 0;
        for (const c of scoredClaims) {
            // Volatility weight multiplier
            let volatilityWeight = 1.0;
            if (c.timeSensitivity === 'HIGHLY_DYNAMIC')
                volatilityWeight = 2.5;
            else if (c.timeSensitivity === 'SEMI_DYNAMIC')
                volatilityWeight = 1.5;
            // Position salience (first assertions carry more answer framing)
            const salienceWeight = c.order === 1 ? 1.25 : 1.0;
            // Outdated claims receive higher penalty weight so they are not washed out
            const outcomeMultiplier = c.status === 'OUTDATED' ? 2.0 : 1.0;
            const claimWeight = volatilityWeight * salienceWeight * outcomeMultiplier;
            weightedSum += c.freshnessScore * claimWeight;
            totalWeight += claimWeight;
        }
        if (totalWeight === 0)
            return 100;
        return Math.max(0, Math.min(100, Math.round(weightedSum / totalWeight)));
    }
}
exports.ScoringEngine = ScoringEngine;
exports.scoringEngine = new ScoringEngine();
//# sourceMappingURL=scoring.engine.js.map