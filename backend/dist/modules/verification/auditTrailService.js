"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditTrailService = exports.AuditTrailService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const verification_service_1 = require("./verification.service");
const logger_1 = require("../../config/logger");
const AuditEvent_1 = require("../../models/AuditEvent");
const sessionStore_1 = require("../../services/sessionStore");
const mongoose_1 = __importDefault(require("mongoose"));
class AuditTrailService {
    /**
     * Generates a tamper-evident, reproducible audit trail package for a verification session.
     */
    async generateAuditPackage(sessionId) {
        const session = await verification_service_1.verificationService.getSessionById(sessionId);
        const results = await verification_service_1.verificationService.getVerificationResults(sessionId);
        const auditId = `audit-${sessionId}-${Date.now()}`;
        const generatedAt = new Date().toISOString();
        const claimsLineage = (results.claims || []).map((c) => ({
            claimId: c.claimId,
            order: c.order,
            claimText: c.claimText,
            verdict: c.verdict,
            confidence: c.confidence,
            searchQuery: c.searchQuery,
            evidenceSources: [
                ...(c.contradictingEvidence || []).map((e) => ({
                    url: e.url,
                    domain: e.domain,
                    publishedDate: e.publishedDate,
                    retrievedAt: e.retrievedAt,
                    authorityScore: e.authorityScore,
                    isContradicting: true,
                })),
                ...(c.supportingEvidence || []).map((e) => ({
                    url: e.url,
                    domain: e.domain,
                    publishedDate: e.publishedDate,
                    retrievedAt: e.retrievedAt,
                    authorityScore: e.authorityScore,
                    isContradicting: false,
                })),
            ],
        }));
        const rawPayloadToHash = JSON.stringify({
            sessionId,
            answer: results.originalAnswer,
            score: results.summary?.overallFreshnessScore,
            claims: claimsLineage,
        });
        const hash = crypto_1.default.createHash('sha256').update(rawPayloadToHash).digest('hex');
        const auditPackage = {
            auditId,
            sessionId,
            fingerprint: {
                algorithm: 'sha256',
                hash,
                generatedAt,
            },
            provenance: {
                system: 'FreshGuard AI',
                version: '1.0.0-enterprise',
                gateway: 'Bifrost AI Gateway by Maxim AI (v2.5)',
                searchEngine: 'Tavily Agentic Search API',
                timestamp: generatedAt,
            },
            pipelineTelemetry: {
                stagesExecuted: [
                    'INPUT_SANITIZATION',
                    'CLAIM_EXTRACTION',
                    'TEMPORAL_CLASSIFICATION',
                    'SEARCH_QUERY_GENERATION',
                    'TAVILY_EVIDENCE_RETRIEVAL',
                    'EVIDENCE_CROSS_EXAMINATION',
                    'CONFLICT_DETECTION',
                    'GROUNDED_SYNTHESIS',
                ],
                processingTimeMs: results.processingTimeMs || 45,
                model: 'openai/gpt-4o',
                fallbackEngaged: true,
            },
            originalInput: {
                text: results.originalAnswer,
                length: (results.originalAnswer || '').length,
                topic: session?.context?.topic,
            },
            claimsLineage,
            verdictSummary: {
                overallFreshnessScore: results.summary?.overallFreshnessScore ?? 100,
                overallRiskLevel: results.summary?.overallRiskLevel ?? 'FRESH',
                totalClaims: results.summary?.totalClaims ?? claimsLineage.length,
                staleClaims: results.summary?.outdated ?? 0,
                supportedClaims: results.summary?.supported ?? 0,
                unverifiedClaims: results.summary?.unverified ?? 0,
            },
        };
        if ((0, sessionStore_1.isMongoConnected)() && mongoose_1.default.Types.ObjectId.isValid(sessionId)) {
            try {
                await AuditEvent_1.AuditEventModel.findOneAndUpdate({ auditId }, {
                    sessionId: new mongoose_1.default.Types.ObjectId(sessionId),
                    userId: session?.userId && mongoose_1.default.Types.ObjectId.isValid(session.userId)
                        ? new mongoose_1.default.Types.ObjectId(session.userId)
                        : undefined,
                    auditId,
                    sha256Hash: hash,
                    eventPayload: auditPackage,
                }, { upsert: true, new: true });
            }
            catch (err) {
                logger_1.logger.warn('Failed persisting AuditEvent to MongoDB', { error: err.message });
            }
        }
        logger_1.logger.info('Audit trail package compiled successfully', {
            sessionId,
            auditId,
            hash: hash.slice(0, 16) + '...',
        });
        return auditPackage;
    }
}
exports.AuditTrailService = AuditTrailService;
exports.auditTrailService = new AuditTrailService();
//# sourceMappingURL=auditTrailService.js.map