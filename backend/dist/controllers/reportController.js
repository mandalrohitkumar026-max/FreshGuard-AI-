"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicReport = exports.shareReport = exports.listReports = exports.getReport = void 0;
const asyncWrapper_1 = require("../utils/asyncWrapper");
const Report_1 = require("../models/Report");
const Claim_1 = require("../models/Claim");
const EvidenceSource_1 = require("../models/EvidenceSource");
const sessionStore_1 = require("../services/sessionStore");
const crypto_1 = require("crypto");
/**
 * GET /api/v1/reports/:reportId
 */
exports.getReport = (0, asyncWrapper_1.asyncWrapper)(async (req, res) => {
    const reportId = String(req.params.reportId);
    const userId = req.userId;
    let report = null;
    if ((0, sessionStore_1.isMongoConnected)()) {
        try {
            report = await Report_1.Report.findOne({ _id: reportId }).lean();
        }
        catch {
            report = sessionStore_1.inMemoryStore.getReport(reportId);
        }
    }
    else {
        report = sessionStore_1.inMemoryStore.getReport(reportId);
    }
    if (!report) {
        res.status(404).json({
            success: false,
            error: { code: 'REPORT_NOT_FOUND', message: 'Report not found' },
        });
        return;
    }
    // If in-memory, claims and evidence are already embedded or linked
    let claims = [];
    if ((0, sessionStore_1.isMongoConnected)() && report.sessionId) {
        try {
            claims = await Claim_1.Claim.find({ sessionId: report.sessionId }).sort({ order: 1 }).lean();
            const evidence = await EvidenceSource_1.EvidenceSource.find({ sessionId: report.sessionId }).lean();
            const evidenceMap = new Map();
            for (const e of evidence) {
                const key = e.claimId.toString();
                if (!evidenceMap.has(key))
                    evidenceMap.set(key, []);
                evidenceMap.get(key).push(e);
            }
            claims = claims.map((c) => ({
                id: c._id.toString(),
                claimId: c._id.toString(),
                claimText: c.claimText,
                category: c.timeSensitivity || 'GENERAL_KNOWLEDGE',
                timeSensitivity: c.timeSensitivity,
                freshnessScore: c.freshnessScore,
                verdict: c.verdict,
                confidence: c.confidence,
                explanation: c.explanation,
                searchQuery: c.searchQuery,
                evidence: evidenceMap.get(c._id.toString()) || [],
            }));
        }
        catch {
            claims = report.claims || sessionStore_1.inMemoryStore.getClaims(report.sessionId?.toString()) || [];
        }
    }
    else {
        claims = report.claims || sessionStore_1.inMemoryStore.getClaims(report.sessionId?.toString()) || [];
    }
    res.json({
        success: true,
        data: {
            id: (report._id || report.id).toString(),
            reportId: (report._id || report.id).toString(),
            sessionId: report.sessionId?.toString(),
            createdAt: report.createdAt,
            summary: report.summary,
            originalAnswer: report.originalAnswer,
            suggestedAnswer: report.correctedAnswer || report.suggestedAnswer,
            correctedAnswer: report.correctedAnswer || report.suggestedAnswer,
            hasCorrectedAnswer: report.hasCorrectedAnswer,
            correctionExplanation: report.correctionExplanation,
            claims,
            topSources: report.topSources || [],
            isPublic: report.isPublic || false,
            publicSlug: report.publicSlug,
        },
    });
    return;
});
/**
 * GET /api/v1/reports — List user reports (paginated)
 */
exports.listReports = (0, asyncWrapper_1.asyncWrapper)(async (req, res) => {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    if ((0, sessionStore_1.isMongoConnected)()) {
        try {
            const skip = (page - 1) * limit;
            const [reports, total] = await Promise.all([
                Report_1.Report.find({ userId })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Report_1.Report.countDocuments({ userId }),
            ]);
            res.json({
                success: true,
                data: {
                    reports,
                    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
                },
            });
            return;
        }
        catch {
            // Fall through to in-memory
        }
    }
    const inMem = sessionStore_1.inMemoryStore.listReports();
    res.json({
        success: true,
        data: {
            reports: inMem.slice((page - 1) * limit, page * limit),
            pagination: { page, limit, total: inMem.length, pages: Math.ceil(inMem.length / limit) },
        },
    });
    return;
});
/**
 * POST /api/v1/reports/:reportId/share — Generate public permalink
 */
exports.shareReport = (0, asyncWrapper_1.asyncWrapper)(async (req, res) => {
    const reportId = String(req.params.reportId);
    const slug = (0, crypto_1.randomBytes)(8).toString('hex');
    if ((0, sessionStore_1.isMongoConnected)()) {
        try {
            await Report_1.Report.findByIdAndUpdate(reportId, { isPublic: true, publicSlug: slug });
        }
        catch {
            // ignore
        }
    }
    const inMem = sessionStore_1.inMemoryStore.getReport(reportId);
    if (inMem) {
        inMem.isPublic = true;
        inMem.publicSlug = slug;
    }
    res.json({
        success: true,
        data: {
            publicSlug: slug,
            shareUrl: `/verification/${slug}`,
        },
    });
    return;
});
/**
 * GET /api/v1/reports/public/:slug — Public report (no auth required)
 */
exports.getPublicReport = (0, asyncWrapper_1.asyncWrapper)(async (req, res) => {
    const slug = String(req.params.slug);
    let report = null;
    if ((0, sessionStore_1.isMongoConnected)()) {
        try {
            report = await Report_1.Report.findOne({ publicSlug: slug, isPublic: true }).lean();
        }
        catch {
            report = sessionStore_1.inMemoryStore.getReport(slug);
        }
    }
    else {
        report = sessionStore_1.inMemoryStore.getReport(slug);
    }
    if (!report) {
        res.status(404).json({
            success: false,
            error: { code: 'REPORT_NOT_FOUND', message: 'Public report not found' },
        });
        return;
    }
    res.json({
        success: true,
        data: report,
    });
    return;
});
//# sourceMappingURL=reportController.js.map