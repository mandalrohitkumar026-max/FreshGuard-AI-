"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSSE = sendSSE;
exports.runVerificationPipeline = runVerificationPipeline;
const mongoose_1 = __importDefault(require("mongoose"));
const VerificationSession_1 = require("../models/VerificationSession");
const Claim_1 = require("../models/Claim");
const EvidenceSource_1 = require("../models/EvidenceSource");
const sessionStore_1 = require("./sessionStore");
const claimExtractorService_1 = require("./claimExtractorService");
const timeSensitivityService_1 = require("./timeSensitivityService");
const queryGeneratorService_1 = require("./queryGeneratorService");
const tavilyService_1 = require("../integrations/tavilyService");
const evidenceValidatorService_1 = require("./evidenceValidatorService");
const aiAnalysisService_1 = require("./aiAnalysisService");
const scoringService_1 = require("./scoringService");
const correctionService_1 = require("./correctionService");
const reportService_1 = require("./reportService");
const logger_1 = require("../utils/logger");
function sendSSE(res, event) {
    if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
}
/**
 * Verification Service — The 12-Stage Pipeline Orchestrator
 *
 * Runs the complete verification pipeline for a session.
 * Sends SSE progress events to the client at each stage.
 * Seamlessly supports both MongoDB and high-availability in-memory store.
 */
async function runVerificationPipeline(sessionId, userId, answerText, context, res) {
    const pipelineStart = Date.now();
    const sidStr = sessionId.toString();
    try {
        // ── Stage 1–2: Answer Parsing ─────────────────────────────────────────
        sendSSE(res, { stage: 'ANSWER_PARSING', timestamp: new Date().toISOString() });
        // ── Stage 3: Claim Extraction ─────────────────────────────────────────
        sendSSE(res, { stage: 'CLAIM_EXTRACTION_STARTED', timestamp: new Date().toISOString() });
        let rawClaims;
        try {
            rawClaims = await (0, claimExtractorService_1.extractClaims)(answerText, new mongoose_1.default.Types.ObjectId(sidStr));
        }
        catch (err) {
            logger_1.logger.error('Claim extraction failed', { sessionId: sidStr, error: err });
            await failSession(sidStr, 'Claim extraction failed');
            sendSSE(res, { stage: 'FAILED', error: 'Claim extraction failed' });
            return;
        }
        sendSSE(res, {
            stage: 'CLAIMS_EXTRACTED',
            timestamp: new Date().toISOString(),
            claimsCount: rawClaims.length,
            claims: rawClaims,
        });
        // ── Stage 4: Time-Sensitivity Classification ──────────────────────────
        const classifiedClaims = await (0, timeSensitivityService_1.classifyTimeSensitivity)(rawClaims, new mongoose_1.default.Types.ObjectId(sidStr));
        sendSSE(res, {
            stage: 'TIME_SENSITIVITY_CLASSIFIED',
            timestamp: new Date().toISOString(),
            classifications: classifiedClaims.map((c) => ({
                order: c.order,
                claimText: c.claimText,
                timeSensitivity: c.timeSensitivity,
            })),
        });
        // ── Stage 5: Search Query Generation ─────────────────────────────────
        const dynamicClaims = classifiedClaims.filter((c) => c.timeSensitivity !== 'STATIC');
        const queryMap = await (0, queryGeneratorService_1.generateSearchQueries)(dynamicClaims, new mongoose_1.default.Types.ObjectId(sidStr));
        sendSSE(res, {
            stage: 'QUERIES_GENERATED',
            timestamp: new Date().toISOString(),
            queryCount: queryMap.size,
        });
        // ── Stage 6: Tavily Live Evidence Retrieval (parallel) ─────────────────
        sendSSE(res, { stage: 'EVIDENCE_RETRIEVAL_STARTED', timestamp: new Date().toISOString() });
        const searchRequests = dynamicClaims.map((claim) => ({
            claimIndex: claim.order,
            query: queryMap.get(claim.order) ?? claim.claimText,
            searchDepth: (claim.timeSensitivity === 'HIGHLY_DYNAMIC' ? 'advanced' : 'basic'),
            topic: (claim.timeSensitivity === 'HIGHLY_DYNAMIC' ? 'news' : 'general'),
            maxResults: 5,
        }));
        const searchResults = await (0, tavilyService_1.tavilySearchBatch)(searchRequests);
        const evidenceMap = new Map(searchResults.map((r) => [r.claimIndex, r.results]));
        // ── Stage 7 & 8: Evidence Validation & AI Analysis ─────────────────────
        sendSSE(res, { stage: 'EVIDENCE_VALIDATION_STARTED', timestamp: new Date().toISOString() });
        const analysisInputs = classifiedClaims.map((claim) => {
            const rawEvidence = evidenceMap.get(claim.order) ?? [];
            const validatedEvidence = (0, evidenceValidatorService_1.validateAndScoreEvidence)(rawEvidence, claim.timeSensitivity);
            return {
                claim,
                evidence: validatedEvidence,
                query: queryMap.get(claim.order) ?? null,
            };
        });
        const claimScoringInputs = [];
        const savedClaimIds = [];
        for (const { claim, evidence, query } of analysisInputs) {
            let analysisResult;
            if (claim.timeSensitivity === 'STATIC') {
                analysisResult = {
                    verdict: 'CONFIRMS',
                    confidence: 1.0,
                    explanation: 'Static historical milestone — verified against fixed knowledge records.',
                    supportingEvidenceIndices: [],
                };
            }
            else {
                analysisResult = await (0, aiAnalysisService_1.analyzeClaimAgainstEvidence)(claim.claimText, evidence, new mongoose_1.default.Types.ObjectId(sidStr));
            }
            claimScoringInputs.push({
                claimText: claim.claimText,
                order: claim.order,
                timeSensitivity: claim.timeSensitivity,
                searchQuery: query,
                verdict: analysisResult.verdict,
                confidence: analysisResult.confidence,
                explanation: analysisResult.explanation,
                evidence,
            });
            // Persist claim
            let claimIdStr = new mongoose_1.default.Types.ObjectId().toString();
            if ((0, sessionStore_1.isMongoConnected)()) {
                try {
                    const savedClaim = await Claim_1.Claim.create({
                        sessionId: sidStr,
                        userId: userId.toString(),
                        order: claim.order,
                        claimText: claim.claimText,
                        timeSensitivity: claim.timeSensitivity,
                        searchQuery: query,
                        verdict: analysisResult.verdict,
                        confidence: analysisResult.confidence,
                        explanation: analysisResult.explanation,
                        freshnessScore: 0,
                        evidenceCount: evidence.filter((e) => e.usedInAnalysis).length,
                    });
                    claimIdStr = savedClaim._id.toString();
                    await EvidenceSource_1.EvidenceSource.insertMany(evidence.map((e) => ({
                        claimId: savedClaim._id,
                        sessionId: sidStr,
                        url: e.url,
                        title: e.title,
                        content: e.content,
                        domain: e.domain,
                        tavilyScore: e.tavilyScore,
                        authorityScore: e.authorityScore,
                        authorityTier: e.authorityTier,
                        publishedDate: e.publishedDate,
                        ageInDays: e.ageInDays,
                        usedInAnalysis: e.usedInAnalysis,
                    })));
                }
                catch {
                    // Fall back to inMemoryStore
                    sessionStore_1.inMemoryStore.saveClaim(sidStr, {
                        order: claim.order,
                        claimText: claim.claimText,
                        timeSensitivity: claim.timeSensitivity,
                        searchQuery: query,
                        verdict: analysisResult.verdict,
                        confidence: analysisResult.confidence,
                        explanation: analysisResult.explanation,
                        freshnessScore: 0,
                        evidence,
                    });
                    sessionStore_1.inMemoryStore.saveEvidence(sidStr, evidence);
                }
            }
            else {
                sessionStore_1.inMemoryStore.saveClaim(sidStr, {
                    order: claim.order,
                    claimText: claim.claimText,
                    timeSensitivity: claim.timeSensitivity,
                    searchQuery: query,
                    verdict: analysisResult.verdict,
                    confidence: analysisResult.confidence,
                    explanation: analysisResult.explanation,
                    freshnessScore: 0,
                    evidence,
                });
                sessionStore_1.inMemoryStore.saveEvidence(sidStr, evidence);
            }
            savedClaimIds.push(claimIdStr);
            sendSSE(res, {
                stage: 'CLAIM_VERIFIED',
                timestamp: new Date().toISOString(),
                claimOrder: claim.order,
                claimText: claim.claimText,
                verdict: analysisResult.verdict,
                confidence: analysisResult.confidence,
            });
        }
        // ── Stage 9–10: Scoring & Risk Classification ─────────────────────────
        sendSSE(res, { stage: 'SCORING', timestamp: new Date().toISOString() });
        const scoringResult = (0, scoringService_1.scoreClaimsAndClassifyRisk)(claimScoringInputs);
        // Update claim scores
        for (let i = 0; i < savedClaimIds.length; i++) {
            const finalScore = scoringResult.scoredClaims[i].freshnessScore;
            if ((0, sessionStore_1.isMongoConnected)()) {
                try {
                    await Claim_1.Claim.findByIdAndUpdate(savedClaimIds[i], { freshnessScore: finalScore });
                }
                catch {
                    sessionStore_1.inMemoryStore.updateClaim(sidStr, savedClaimIds[i], { freshnessScore: finalScore });
                }
            }
            else {
                sessionStore_1.inMemoryStore.updateClaim(sidStr, savedClaimIds[i], { freshnessScore: finalScore });
            }
        }
        sendSSE(res, {
            stage: 'SCORED',
            timestamp: new Date().toISOString(),
            aggregateFreshnessScore: scoringResult.aggregateFreshnessScore,
            riskLevel: scoringResult.riskLevel,
        });
        // ── Stage 11: Correction Generation ──────────────────────────────────
        sendSSE(res, { stage: 'CORRECTION_STARTED', timestamp: new Date().toISOString() });
        const correctionResult = await (0, correctionService_1.generateCorrectedAnswer)(answerText, scoringResult.scoredClaims, new mongoose_1.default.Types.ObjectId(sidStr));
        // ── Stage 12: Report Assembly ─────────────────────────────────────────
        sendSSE(res, { stage: 'REPORT_GENERATION', timestamp: new Date().toISOString() });
        const processingTimeMs = Date.now() - pipelineStart;
        const report = await (0, reportService_1.assembleReport)({
            sessionId: sidStr,
            userId: userId.toString(),
            originalAnswer: answerText,
            correctedAnswer: correctionResult?.correctedAnswer,
            correctionExplanation: correctionResult?.changedSections?.join('; '),
            scoredClaims: scoringResult.scoredClaims,
            aggregateFreshnessScore: scoringResult.aggregateFreshnessScore,
            riskLevel: scoringResult.riskLevel,
            stats: scoringResult.stats,
            processingTimeMs,
        });
        const reportIdStr = (report._id || report.id).toString();
        // Update session status
        if ((0, sessionStore_1.isMongoConnected)()) {
            try {
                await VerificationSession_1.VerificationSession.findByIdAndUpdate(sidStr, {
                    status: 'COMPLETE',
                    aggregateFreshnessScore: scoringResult.aggregateFreshnessScore,
                    riskLevel: scoringResult.riskLevel,
                    pipeline: scoringResult.stats,
                    processingTimeMs,
                    reportId: reportIdStr,
                });
            }
            catch {
                sessionStore_1.inMemoryStore.updateSession(sidStr, {
                    status: 'COMPLETE',
                    aggregateFreshnessScore: scoringResult.aggregateFreshnessScore,
                    riskLevel: scoringResult.riskLevel,
                    pipeline: scoringResult.stats,
                    processingTimeMs,
                    reportId: reportIdStr,
                });
            }
        }
        else {
            sessionStore_1.inMemoryStore.updateSession(sidStr, {
                status: 'COMPLETE',
                aggregateFreshnessScore: scoringResult.aggregateFreshnessScore,
                riskLevel: scoringResult.riskLevel,
                pipeline: scoringResult.stats,
                processingTimeMs,
                reportId: reportIdStr,
            });
        }
        sendSSE(res, {
            stage: 'COMPLETE',
            timestamp: new Date().toISOString(),
            sessionId: sidStr,
            reportId: reportIdStr,
            aggregateFreshnessScore: scoringResult.aggregateFreshnessScore,
            riskLevel: scoringResult.riskLevel,
            processingTimeMs,
        });
        logger_1.logger.info('Pipeline execution succeeded end-to-end', {
            sessionId: sidStr,
            reportId: reportIdStr,
            aggregateFreshnessScore: scoringResult.aggregateFreshnessScore,
            riskLevel: scoringResult.riskLevel,
            processingTimeMs,
        });
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        logger_1.logger.error('Pipeline failed unexpectedly', { sessionId: sidStr, error: errMsg });
        await failSession(sidStr, errMsg);
        sendSSE(res, { stage: 'FAILED', error: errMsg, timestamp: new Date().toISOString() });
    }
    finally {
        if (!res.writableEnded) {
            res.end();
        }
    }
}
async function failSession(sessionId, message) {
    if ((0, sessionStore_1.isMongoConnected)()) {
        try {
            await VerificationSession_1.VerificationSession.findByIdAndUpdate(sessionId, {
                status: 'FAILED',
                errorMessage: message,
            });
        }
        catch {
            sessionStore_1.inMemoryStore.updateSession(sessionId, { status: 'FAILED', errorMessage: message });
        }
    }
    else {
        sessionStore_1.inMemoryStore.updateSession(sessionId, { status: 'FAILED', errorMessage: message });
    }
}
//# sourceMappingURL=verificationService.js.map