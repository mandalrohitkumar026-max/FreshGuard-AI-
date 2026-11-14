"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationService = exports.VerificationService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const verification_model_1 = require("./verification.model");
const claim_model_1 = require("../claims/claim.model");
const evidence_model_1 = require("../evidence/evidence.model");
const report_model_1 = require("../reports/report.model");
const claimExtractionService_1 = require("../claims/claimExtractionService");
const freshnessDetectionService_1 = require("../freshness/freshnessDetectionService");
const evidenceAnalysisService_1 = require("./evidenceAnalysisService");
const correctionService_1 = require("./correctionService");
const scoring_service_1 = require("../scoring/scoring.service");
const sessionStore_1 = require("../../services/sessionStore");
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const logger_1 = require("../../config/logger");
// In-memory verification cache for fast retrieval and testing resilience
const verificationResultsStore = new Map();
class VerificationService {
    async createSession(data) {
        const userIdObj = mongoose_1.default.Types.ObjectId.isValid(data.userId)
            ? new mongoose_1.default.Types.ObjectId(data.userId)
            : new mongoose_1.default.Types.ObjectId('000000000000000000000001');
        if ((0, database_1.isMongoConnected)()) {
            try {
                const session = await verification_model_1.VerificationSession.create({
                    userId: userIdObj,
                    originalAnswer: data.originalAnswer,
                    context: data.context
                        ? { ...data.context, submittedAt: new Date() }
                        : { submittedAt: new Date() },
                    status: 'PROCESSING',
                });
                return session.toObject();
            }
            catch (err) {
                logger_1.logger.warn('Mongo session creation failed, using in-memory store', { error: err.message });
            }
        }
        return sessionStore_1.inMemoryStore.createSession({
            userId: userIdObj,
            originalAnswer: data.originalAnswer,
            context: data.context,
            status: 'PROCESSING',
        });
    }
    async getSessionById(id, requesterUserId, requesterUserRole) {
        let session = null;
        if ((0, database_1.isMongoConnected)() && mongoose_1.default.Types.ObjectId.isValid(id)) {
            try {
                session = await verification_model_1.VerificationSession.findById(id).lean();
            }
            catch {
                // Fallback
            }
        }
        if (!session) {
            session = sessionStore_1.inMemoryStore.getSession(id);
        }
        if (!session) {
            throw ApiError_1.ApiError.notFound('Verification session not found');
        }
        // IDOR Protection: enforce user ownership for authenticated users
        const sessionOwner = session.userId ? session.userId.toString() : null;
        const isOwnerRegistered = sessionOwner && sessionOwner !== '000000000000000000000001';
        if (isOwnerRegistered &&
            requesterUserId &&
            requesterUserId !== '000000000000000000000001' &&
            sessionOwner !== requesterUserId &&
            requesterUserRole !== 'admin') {
            throw ApiError_1.ApiError.forbidden('You do not have permission to access this verification session');
        }
        return session;
    }
    async listSessions(userId, filters = {}) {
        const page = Math.max(1, filters.page || 1);
        const limit = Math.min(50, Math.max(1, filters.limit || 10));
        const skip = (page - 1) * limit;
        if ((0, database_1.isMongoConnected)()) {
            try {
                const query = {};
                if (userId && mongoose_1.default.Types.ObjectId.isValid(userId)) {
                    query.userId = new mongoose_1.default.Types.ObjectId(userId);
                }
                if (filters.riskLevel) {
                    query.riskLevel = filters.riskLevel;
                }
                const [sessions, total] = await Promise.all([
                    verification_model_1.VerificationSession.find(query)
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)
                        .lean(),
                    verification_model_1.VerificationSession.countDocuments(query),
                ]);
                return {
                    sessions,
                    total,
                    page,
                    limit,
                };
            }
            catch {
                // Fallback
            }
        }
        let all = sessionStore_1.inMemoryStore.listSessions(userId);
        if (filters.riskLevel) {
            all = all.filter((s) => s.riskLevel === filters.riskLevel);
        }
        const total = all.length;
        const paginated = all.slice(skip, skip + limit);
        return {
            sessions: paginated,
            total,
            page,
            limit,
        };
    }
    async deleteSession(id, userId) {
        verificationResultsStore.delete(id);
        if ((0, database_1.isMongoConnected)() && mongoose_1.default.Types.ObjectId.isValid(id)) {
            try {
                const query = { _id: id };
                if (userId && mongoose_1.default.Types.ObjectId.isValid(userId)) {
                    query.userId = new mongoose_1.default.Types.ObjectId(userId);
                }
                const session = await verification_model_1.VerificationSession.findOneAndDelete(query);
                if (session) {
                    await claim_model_1.Claim.deleteMany({ sessionId: id });
                    await evidence_model_1.EvidenceSource.deleteMany({ sessionId: id });
                    await report_model_1.Report.deleteMany({ sessionId: id });
                    return true;
                }
            }
            catch {
                // Fallback
            }
        }
        const session = sessionStore_1.inMemoryStore.getSession(id);
        if (!session) {
            throw ApiError_1.ApiError.notFound('Verification session not found');
        }
        return true;
    }
    /**
     * PHASE 08 CORE PIPELINE:
     * Runs the complete verification pipeline for a session:
     * 1. Claim Extraction (Phase 06)
     * 2. Freshness & Temporal Analysis (Phase 07)
     * 3. Live Web Retrieval & Evidence Comparison (Phase 05 & 08)
     * 4. Grounded Correction Generation (Phase 08)
     * 5. Metrics Scoring & Persistence
     */
    async runVerification(sessionId) {
        const startTime = Date.now();
        const session = await this.getSessionById(sessionId);
        const originalAnswer = session.originalAnswer;
        const userId = session.userId ? session.userId.toString() : '000000000000000000000001';
        logger_1.logger.info('Starting Phase 08 Live Verification Pipeline', {
            sessionId,
            answerLength: originalAnswer.length,
        });
        // 1. Stage: Extract discrete atomic claims
        const extraction = await claimExtractionService_1.claimExtractionService.extractClaims(originalAnswer, {
            verificationId: sessionId,
            userId,
            persistToDb: true,
        });
        const claims = extraction.claims;
        // 2. Stage: Detect freshness, time sensitivity & search strategy
        const freshnessRes = await freshnessDetectionService_1.freshnessDetectionService.analyzeFreshness(claims, {
            verificationId: sessionId,
            userId,
        });
        const temporalMap = new Map((freshnessRes.analysis || []).map((a) => [a.claimId, a]));
        // 3. Stage: Evidence Retrieval & Live Comparison for each claim
        const verifiedClaims = [];
        for (const c of claims) {
            const temporal = temporalMap.get(c.claimId);
            const verified = await evidenceAnalysisService_1.evidenceAnalysisService.verifyClaim(c, temporal, sessionId);
            verifiedClaims.push(verified);
        }
        // 4. Stage: Grounded Correction Generation
        const correction = await correctionService_1.correctionService.generateGroundedCorrection(originalAnswer, verifiedClaims, sessionId);
        // 5. Compute summary metrics & aggregate score via Phase 10 Advanced Scoring Engine
        const scoringInput = verifiedClaims.map((c) => {
            const orig = claims.find((o) => o.claimId === c.claimId || o.order === c.order);
            return {
                claimId: c.claimId,
                order: c.order,
                claimText: c.claimText,
                timeSensitivity: (orig?.timeSensitivity || (c.status === 'NOT_CHECKED' ? 'STATIC' : 'HIGHLY_DYNAMIC')),
                category: orig?.category,
                verdict: c.verdict,
                status: c.status,
                confidence: c.confidence,
                explanation: c.explanation,
                evidence: [...(c.contradictingEvidence || []), ...(c.supportingEvidence || [])],
                conflictAnalysis: c.conflictAnalysis,
            };
        });
        const evaluated = scoring_service_1.scoringService.evaluateAnswer(scoringInput);
        // Merge evaluated scores, factors, and explainability back to verifiedClaims
        verifiedClaims.forEach((vc, idx) => {
            const ev = evaluated.claims[idx];
            if (ev) {
                vc.freshnessScore = ev.freshnessScore;
                vc.riskLevel = ev.riskLevel;
                vc.timeSensitivity = ev.timeSensitivity;
                vc.factors = ev.factors;
                vc.recommendedAction = ev.recommendedAction;
                vc.positiveContributions = ev.positiveContributions;
                vc.negativeContributions = ev.negativeContributions;
            }
        });
        const totalClaims = evaluated.totalClaims || 1;
        const overallFreshnessScore = evaluated.overallFreshnessScore;
        const overallRiskLevel = evaluated.overallRiskLevel;
        const summary = {
            totalClaims,
            supported: evaluated.supportedClaims,
            outdated: evaluated.outdatedClaims,
            partiallySupported: evaluated.partiallySupportedClaims,
            conflicting: evaluated.conflictingClaims,
            unverified: evaluated.unverifiedClaims,
            notChecked: evaluated.claimsNotChecked,
            overallFreshnessScore,
            overallRiskLevel,
            freshnessInterpretation: evaluated.freshnessInterpretation,
            riskExplanation: evaluated.riskExplanation,
        };
        const processingTimeMs = Date.now() - startTime;
        const completedAt = new Date().toISOString();
        const pipelineResult = {
            sessionId,
            userId,
            originalAnswer,
            status: 'COMPLETE',
            summary,
            claims: verifiedClaims,
            correction,
            processingTimeMs,
            completedAt,
        };
        // Store in-memory cache
        verificationResultsStore.set(sessionId, pipelineResult);
        // 6. Persist to MongoDB or InMemoryStore
        if ((0, database_1.isMongoConnected)() && mongoose_1.default.Types.ObjectId.isValid(sessionId)) {
            try {
                await verification_model_1.VerificationSession.findByIdAndUpdate(sessionId, {
                    status: 'COMPLETE',
                    aggregateFreshnessScore: overallFreshnessScore,
                    riskLevel: overallRiskLevel,
                    processingTimeMs,
                    'pipeline.totalClaims': totalClaims,
                    'pipeline.staticClaims': summary.notChecked,
                    'pipeline.staleClaims': summary.outdated,
                    'pipeline.unverifiableClaims': summary.unverified,
                });
                // Update Claim documents
                for (const vc of verifiedClaims) {
                    const claimScore = vc.status === 'SUPPORTED' || vc.status === 'NOT_CHECKED'
                        ? 100
                        : vc.status === 'PARTIALLY_SUPPORTED'
                            ? 50
                            : vc.status === 'UNVERIFIED'
                                ? 40
                                : vc.status === 'CONFLICTING'
                                    ? 30
                                    : 0;
                    await claim_model_1.Claim.findOneAndUpdate({ sessionId, order: vc.order }, {
                        verificationStatus: vc.status,
                        verdict: vc.verdict,
                        confidence: vc.confidence,
                        explanation: vc.explanation,
                        searchQuery: vc.searchQuery,
                        suggestedCorrection: vc.suggestedCorrection,
                        freshnessScore: claimScore,
                        evidenceCount: vc.supportingEvidence.length + vc.contradictingEvidence.length,
                    });
                }
            }
            catch (err) {
                logger_1.logger.warn('Failed to persist verification results to MongoDB', { error: err.message });
            }
        }
        else {
            sessionStore_1.inMemoryStore.updateSession(sessionId, {
                status: 'COMPLETE',
                aggregateFreshnessScore: overallFreshnessScore,
                riskLevel: overallRiskLevel,
                processingTimeMs,
                pipeline: {
                    totalClaims,
                    staticClaims: summary.notChecked,
                    staleClaims: summary.outdated,
                    unverifiableClaims: summary.unverified,
                },
            });
        }
        logger_1.logger.info('Verification Pipeline successfully executed', {
            sessionId,
            overallFreshnessScore,
            overallRiskLevel,
            processingTimeMs,
        });
        return pipelineResult;
    }
    /**
     * Retrieves full verification results including summary, verified claims, and grounded correction.
     */
    async getVerificationResults(sessionId) {
        const cached = verificationResultsStore.get(sessionId);
        if (cached)
            return cached;
        // Check if session exists
        const session = await this.getSessionById(sessionId);
        // If not yet verified or still in processing, run verification pipeline
        if (session.status !== 'COMPLETE') {
            return this.runVerification(sessionId);
        }
        // Load from DB
        if ((0, database_1.isMongoConnected)() && mongoose_1.default.Types.ObjectId.isValid(sessionId)) {
            const claimsDocs = await claim_model_1.Claim.find({ sessionId }).sort({ order: 1 }).lean();
            const verifiedClaims = claimsDocs.map((c) => ({
                claimId: c.claimId || `claim-${c.order}`,
                order: c.order,
                claimText: c.claimText,
                status: c.verificationStatus || 'UNVERIFIED',
                verdict: c.verdict || 'INSUFFICIENT',
                confidence: c.confidence || 0.8,
                explanation: c.explanation || '',
                suggestedCorrection: c.suggestedCorrection,
                supportingEvidence: [],
                contradictingEvidence: [],
                sources: [],
                searchQuery: c.searchQuery,
                verifiedAt: c.createdAt?.toISOString() || new Date().toISOString(),
            }));
            const summary = {
                totalClaims: session.pipeline?.totalClaims || verifiedClaims.length,
                supported: verifiedClaims.filter((c) => c.status === 'SUPPORTED').length,
                outdated: session.pipeline?.staleClaims || verifiedClaims.filter((c) => c.status === 'OUTDATED').length,
                partiallySupported: verifiedClaims.filter((c) => c.status === 'PARTIALLY_SUPPORTED').length,
                conflicting: verifiedClaims.filter((c) => c.status === 'CONFLICTING').length,
                unverified: session.pipeline?.unverifiableClaims || verifiedClaims.filter((c) => c.status === 'UNVERIFIED').length,
                notChecked: session.pipeline?.staticClaims || verifiedClaims.filter((c) => c.status === 'NOT_CHECKED').length,
                overallFreshnessScore: session.aggregateFreshnessScore || 80,
                overallRiskLevel: session.riskLevel || 'FRESH',
            };
            const result = {
                sessionId,
                userId: session.userId?.toString() || '',
                originalAnswer: session.originalAnswer,
                status: session.status,
                summary,
                claims: verifiedClaims,
                processingTimeMs: session.processingTimeMs || 0,
                completedAt: session.updatedAt?.toISOString() || new Date().toISOString(),
            };
            verificationResultsStore.set(sessionId, result);
            return result;
        }
        // In-memory fallback
        return this.runVerification(sessionId);
    }
    /**
     * Retrieves the grounded correction for a session.
     */
    async getCorrection(sessionId) {
        const results = await this.getVerificationResults(sessionId);
        if (results.correction) {
            return results.correction;
        }
        return correctionService_1.correctionService.generateGroundedCorrection(results.originalAnswer, results.claims, sessionId);
    }
    /**
     * Retrieves evidence details and sources for an individual claim.
     */
    async getClaimEvidence(claimIdOrOrder) {
        // Search across cached results
        for (const res of verificationResultsStore.values()) {
            const matched = res.claims.find((c) => c.claimId === claimIdOrOrder || String(c.order) === claimIdOrOrder);
            if (matched) {
                return {
                    claimId: matched.claimId,
                    supportingEvidence: matched.supportingEvidence,
                    contradictingEvidence: matched.contradictingEvidence,
                    sources: matched.sources,
                };
            }
        }
        // Try finding in MongoDB
        if ((0, database_1.isMongoConnected)()) {
            const claim = await claim_model_1.Claim.findOne({
                $or: [
                    { claimId: claimIdOrOrder },
                    ...(mongoose_1.default.Types.ObjectId.isValid(claimIdOrOrder) ? [{ _id: claimIdOrOrder }] : []),
                ],
            }).lean();
            if (claim) {
                const evidenceDocs = await evidence_model_1.EvidenceSource.find({ claimId: claim._id }).lean();
                return {
                    claimId: claim.claimId || claim._id.toString(),
                    supportingEvidence: evidenceDocs.filter((e) => !e.isContradicting),
                    contradictingEvidence: evidenceDocs.filter((e) => e.isContradicting),
                    sources: evidenceDocs.map((e) => ({
                        url: e.url,
                        title: e.title,
                        domain: e.domain,
                        authorityTier: e.authorityTier,
                    })),
                };
            }
        }
        throw ApiError_1.ApiError.notFound(`Evidence for claim ${claimIdOrOrder} not found`);
    }
}
exports.VerificationService = VerificationService;
exports.verificationService = new VerificationService();
//# sourceMappingURL=verification.service.js.map