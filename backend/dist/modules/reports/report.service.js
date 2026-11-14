"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = exports.ReportService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const report_model_1 = require("./report.model");
const claim_model_1 = require("../claims/claim.model");
const evidence_model_1 = require("../evidence/evidence.model");
const sessionStore_1 = require("../../services/sessionStore");
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const crypto_1 = require("crypto");
class ReportService {
    async getReport(reportOrSessionId, requesterUserId, requesterUserRole) {
        let report = null;
        if ((0, database_1.isMongoConnected)()) {
            try {
                if (mongoose_1.default.Types.ObjectId.isValid(reportOrSessionId)) {
                    report = await report_model_1.Report.findOne({
                        $or: [{ _id: reportOrSessionId }, { sessionId: reportOrSessionId }],
                    }).lean();
                }
            }
            catch {
                // Fallback
            }
        }
        if (!report) {
            report = sessionStore_1.inMemoryStore.getReport(reportOrSessionId);
            if (!report) {
                // Maybe it's a sessionId in memory store
                const session = sessionStore_1.inMemoryStore.getSession(reportOrSessionId);
                if (session && session.reportId) {
                    report = sessionStore_1.inMemoryStore.getReport(session.reportId);
                }
            }
        }
        if (!report) {
            throw ApiError_1.ApiError.notFound('Report not found');
        }
        // IDOR Protection: enforce user ownership unless report is explicitly public
        const reportOwner = report.userId ? report.userId.toString() : null;
        const isOwnerRegistered = reportOwner && reportOwner !== '000000000000000000000001';
        if (!report.isPublic &&
            isOwnerRegistered &&
            requesterUserId &&
            requesterUserId !== '000000000000000000000001' &&
            reportOwner !== requesterUserId &&
            requesterUserRole !== 'admin') {
            throw ApiError_1.ApiError.forbidden('You do not have permission to access this report');
        }
        // Attach full claims and evidence if available
        let claims = [];
        if ((0, database_1.isMongoConnected)() && report.sessionId) {
            try {
                claims = await claim_model_1.Claim.find({ sessionId: report.sessionId }).sort({ order: 1 }).lean();
                const evidence = await evidence_model_1.EvidenceSource.find({ sessionId: report.sessionId }).lean();
                const evidenceMap = new Map();
                for (const e of evidence) {
                    const key = e.claimId ? e.claimId.toString() : '';
                    if (!evidenceMap.has(key))
                        evidenceMap.set(key, []);
                    evidenceMap.get(key).push(e);
                }
                claims = claims.map((c) => ({
                    id: c._id.toString(),
                    claimId: c._id.toString(),
                    claimText: c.claimText,
                    category: c.category || c.timeSensitivity || 'GENERAL',
                    timeSensitivity: c.timeSensitivity,
                    freshnessScore: c.freshnessScore,
                    verdict: c.verdict,
                    confidence: c.confidence,
                    explanation: c.explanation,
                    suggestedCorrection: c.suggestedCorrection,
                    searchQuery: c.searchQuery,
                    evidence: evidenceMap.get(c._id.toString()) || [],
                }));
            }
            catch {
                // In-memory fallback
            }
        }
        if (claims.length === 0 && report.sessionId) {
            const memClaims = sessionStore_1.inMemoryStore.getClaims(report.sessionId.toString());
            const memEvidence = sessionStore_1.inMemoryStore.getEvidence(report.sessionId.toString());
            claims = memClaims.map((c) => ({
                id: c.id || c._id,
                claimId: c.id || c._id,
                claimText: c.claimText,
                category: c.category || c.timeSensitivity || 'GENERAL',
                timeSensitivity: c.timeSensitivity,
                freshnessScore: c.freshnessScore,
                verdict: c.verdict,
                confidence: c.confidence,
                explanation: c.explanation,
                suggestedCorrection: c.suggestedCorrection,
                searchQuery: c.searchQuery,
                evidence: memEvidence.filter((e) => e.claimId === (c.id || c._id)),
            }));
        }
        return {
            ...report,
            id: report._id ? report._id.toString() : report.id,
            claims,
        };
    }
    async shareReport(reportId) {
        const slug = (0, crypto_1.randomBytes)(6).toString('hex');
        if ((0, database_1.isMongoConnected)() && mongoose_1.default.Types.ObjectId.isValid(reportId)) {
            try {
                const updated = await report_model_1.Report.findByIdAndUpdate(reportId, { isPublic: true, publicSlug: slug }, { new: true }).lean();
                if (updated) {
                    return {
                        publicSlug: slug,
                        shareUrl: `/report/public/${slug}`,
                    };
                }
            }
            catch {
                // Fallback
            }
        }
        const memReport = sessionStore_1.inMemoryStore.getReport(reportId);
        if (!memReport) {
            throw ApiError_1.ApiError.notFound('Report not found');
        }
        memReport.isPublic = true;
        memReport.publicSlug = slug;
        return {
            publicSlug: slug,
            shareUrl: `/report/public/${slug}`,
        };
    }
}
exports.ReportService = ReportService;
exports.reportService = new ReportService();
//# sourceMappingURL=report.service.js.map