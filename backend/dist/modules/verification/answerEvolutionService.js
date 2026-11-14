"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.answerEvolutionService = exports.AnswerEvolutionService = void 0;
const verification_service_1 = require("./verification.service");
const sessionStore_1 = require("../../services/sessionStore");
const VerificationVersion_1 = require("../../models/VerificationVersion");
const logger_1 = require("../../config/logger");
const mongoose_1 = __importDefault(require("mongoose"));
class AnswerEvolutionService {
    /**
     * Compares two verification reports and tracks claim-by-claim evolution.
     */
    async compareVersions(parentSessionId, currentSessionId) {
        const [prevResult, currResult] = await Promise.all([
            verification_service_1.verificationService.getVerificationResults(parentSessionId),
            verification_service_1.verificationService.getVerificationResults(currentSessionId),
        ]);
        const prevClaims = prevResult.claims || [];
        const currClaims = currResult.claims || [];
        const prevScore = prevResult.summary?.overallFreshnessScore ?? 0;
        const currScore = currResult.summary?.overallFreshnessScore ?? 0;
        const scoreDelta = currScore - prevScore;
        const addedClaims = [];
        const changedClaims = [];
        const unmodifiedClaims = [];
        const matchedPrevIndices = new Set();
        // Similarity helper
        const isSimilarClaim = (a, b) => {
            const normA = a.toLowerCase().replace(/[^a-z0-9]/g, '');
            const normB = b.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (normA === normB)
                return true;
            if (normA.includes(normB) || normB.includes(normA))
                return true;
            // Word token overlap
            const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
            const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
            if (wordsA.size === 0 || wordsB.size === 0)
                return false;
            let common = 0;
            for (const w of wordsA)
                if (wordsB.has(w))
                    common++;
            return common / Math.min(wordsA.size, wordsB.size) >= 0.6;
        };
        for (const curr of currClaims) {
            let foundMatchIdx = -1;
            for (let i = 0; i < prevClaims.length; i++) {
                if (!matchedPrevIndices.has(i) && isSimilarClaim(curr.claimText, prevClaims[i].claimText)) {
                    foundMatchIdx = i;
                    break;
                }
            }
            if (foundMatchIdx >= 0) {
                matchedPrevIndices.add(foundMatchIdx);
                const prev = prevClaims[foundMatchIdx];
                if (prev.status !== curr.status || prev.verdict !== curr.verdict) {
                    let resolutionType = 'REFINED';
                    let classification = 'MODIFIED';
                    if (prev.status === 'OUTDATED' && curr.status === 'SUPPORTED') {
                        resolutionType = 'STALENESS_RESOLVED';
                        classification = 'NEWLY_SUPPORTED';
                    }
                    else if (prev.status === 'SUPPORTED' && curr.status === 'OUTDATED') {
                        resolutionType = 'NEWLY_OUTDATED';
                        classification = 'NEWLY_OUTDATED';
                    }
                    else if (curr.status === 'OUTDATED') {
                        classification = 'NEWLY_OUTDATED';
                    }
                    else if (curr.status === 'SUPPORTED') {
                        classification = 'NEWLY_SUPPORTED';
                    }
                    else if (curr.status === 'CONFLICTING') {
                        classification = 'NEWLY_CONFLICTING';
                    }
                    else if (curr.status === 'UNVERIFIED') {
                        classification = 'NEWLY_UNVERIFIED';
                    }
                    changedClaims.push({
                        claimText: curr.claimText,
                        previousStatus: prev.status,
                        currentStatus: curr.status,
                        previousVerdict: prev.verdict,
                        currentVerdict: curr.verdict,
                        classification,
                        resolutionType,
                        explanation: curr.explanation,
                    });
                }
                else {
                    unmodifiedClaims.push(curr);
                }
            }
            else {
                addedClaims.push(curr);
            }
        }
        const removedClaims = prevClaims.filter((_, idx) => !matchedPrevIndices.has(idx));
        const stalenessResolvedCount = changedClaims.filter((c) => c.resolutionType === 'STALENESS_RESOLVED').length;
        const newlyOutdatedCount = changedClaims.filter((c) => c.resolutionType === 'NEWLY_OUTDATED').length;
        let summary = '';
        if (scoreDelta > 0) {
            summary = `Freshness improved by +${scoreDelta}% across revisions (${stalenessResolvedCount} stale assertion(s) successfully resolved).`;
        }
        else if (scoreDelta < 0) {
            summary = `Freshness dropped by ${scoreDelta}%; new revision introduced ${newlyOutdatedCount} outdated assertion(s).`;
        }
        else {
            summary = `Freshness score maintained at ${currScore}% with ${changedClaims.length} refined assertions.`;
        }
        // Build timeline
        const timeline = [
            {
                version: 1,
                sessionId: parentSessionId,
                timestamp: prevResult.completedAt || new Date().toISOString(),
                overallFreshnessScore: prevScore,
                totalClaims: prevResult.summary?.totalClaims ?? prevClaims.length,
                staleClaims: prevResult.summary?.outdated ?? 0,
                riskLevel: prevResult.summary?.overallRiskLevel ?? 'STALE',
            },
            {
                version: 2,
                sessionId: currentSessionId,
                timestamp: currResult.completedAt || new Date().toISOString(),
                overallFreshnessScore: currScore,
                totalClaims: currResult.summary?.totalClaims ?? currClaims.length,
                staleClaims: currResult.summary?.outdated ?? 0,
                riskLevel: currResult.summary?.overallRiskLevel ?? 'FRESH',
            },
        ];
        logger_1.logger.info('Answer evolution comparison completed', {
            parentSessionId,
            currentSessionId,
            scoreDelta,
            stalenessResolvedCount,
        });
        if ((0, sessionStore_1.isMongoConnected)() &&
            mongoose_1.default.Types.ObjectId.isValid(parentSessionId) &&
            mongoose_1.default.Types.ObjectId.isValid(currentSessionId)) {
            try {
                const claimTransitions = [
                    ...addedClaims.map((c) => ({
                        claimText: c.claimText,
                        currentStatus: c.status,
                        classification: 'ADDED',
                        explanation: c.explanation,
                    })),
                    ...removedClaims.map((c) => ({
                        claimText: c.claimText,
                        previousStatus: c.status,
                        classification: 'REMOVED',
                        explanation: 'Claim was removed in newer answer revision.',
                    })),
                    ...unmodifiedClaims.map((c) => ({
                        claimText: c.claimText,
                        previousStatus: c.status,
                        currentStatus: c.status,
                        classification: 'UNCHANGED',
                        explanation: 'Identical assertion maintained across revisions.',
                    })),
                    ...changedClaims.map((c) => ({
                        claimText: c.claimText,
                        previousStatus: c.previousStatus,
                        currentStatus: c.currentStatus,
                        classification: c.classification,
                        explanation: c.explanation,
                    })),
                ];
                await VerificationVersion_1.VerificationVersion.findOneAndUpdate({
                    parentSessionId: new mongoose_1.default.Types.ObjectId(parentSessionId),
                    currentSessionId: new mongoose_1.default.Types.ObjectId(currentSessionId),
                }, {
                    parentSessionId: new mongoose_1.default.Types.ObjectId(parentSessionId),
                    currentSessionId: new mongoose_1.default.Types.ObjectId(currentSessionId),
                    userId: prevResult.userId && mongoose_1.default.Types.ObjectId.isValid(prevResult.userId)
                        ? new mongoose_1.default.Types.ObjectId(prevResult.userId)
                        : undefined,
                    versionNumber: 2,
                    scoreDelta,
                    previousScore: prevScore,
                    currentScore: currScore,
                    previousRisk: prevResult.summary?.overallRiskLevel || 'MODERATE',
                    currentRisk: currResult.summary?.overallRiskLevel || 'LOW',
                    claimTransitions,
                    summary,
                }, { upsert: true, new: true });
            }
            catch (err) {
                logger_1.logger.warn('Failed persisting VerificationVersion to MongoDB', { error: err.message });
            }
        }
        return {
            parentSessionId,
            currentSessionId,
            version: 2,
            scoreDelta,
            previousScore: prevScore,
            currentScore: currScore,
            addedClaims,
            removedClaims,
            changedClaims,
            unmodifiedClaims,
            stalenessResolvedCount,
            newlyOutdatedCount,
            summary,
            timeline,
        };
    }
    /**
     * Submits a revised version of an answer, verifies it, links it to parentSessionId,
     * and returns both the verification report and evolution delta.
     */
    async submitRevision(data) {
        // 1. Create revised session
        const session = await verification_service_1.verificationService.createSession({
            userId: data.userId,
            originalAnswer: data.revisedAnswer,
            context: {
                ...(data.context || {}),
                parentSessionId: data.parentSessionId,
                isRevision: true,
            },
        });
        const newSessionId = (session._id || session.id).toString();
        // 2. Run verification
        const verification = await verification_service_1.verificationService.runVerification(newSessionId);
        // 3. Compute evolution
        const evolution = await this.compareVersions(data.parentSessionId, newSessionId);
        return {
            verification,
            evolution,
        };
    }
}
exports.AnswerEvolutionService = AnswerEvolutionService;
exports.answerEvolutionService = new AnswerEvolutionService();
//# sourceMappingURL=answerEvolutionService.js.map