"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = exports.getHistory = void 0;
const asyncWrapper_1 = require("../utils/asyncWrapper");
const VerificationSession_1 = require("../models/VerificationSession");
const sessionStore_1 = require("../services/sessionStore");
/**
 * GET /api/v1/history
 */
exports.getHistory = (0, asyncWrapper_1.asyncWrapper)(async (req, res) => {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = req.query.search;
    const riskLevel = req.query.riskLevel;
    const sortBy = req.query.sortBy;
    if ((0, sessionStore_1.isMongoConnected)()) {
        try {
            const skip = (page - 1) * limit;
            const filter = userId ? { userId } : {};
            if (riskLevel && riskLevel !== 'ALL')
                filter.riskLevel = riskLevel;
            if (search) {
                filter.$or = [
                    { originalAnswer: { $regex: search, $options: 'i' } },
                    { 'context.topic': { $regex: search, $options: 'i' } },
                ];
            }
            let sortOptions = { createdAt: -1 };
            if (sortBy === 'date_asc')
                sortOptions = { createdAt: 1 };
            else if (sortBy === 'score_desc')
                sortOptions = { aggregateFreshnessScore: -1 };
            else if (sortBy === 'score_asc')
                sortOptions = { aggregateFreshnessScore: 1 };
            const [sessions, total] = await Promise.all([
                VerificationSession_1.VerificationSession.find(filter)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limit)
                    .select('-originalAnswer')
                    .lean(),
                VerificationSession_1.VerificationSession.countDocuments(filter),
            ]);
            res.json({
                success: true,
                data: {
                    sessions: sessions.map((s) => ({
                        id: s._id.toString(),
                        sessionId: s._id.toString(),
                        status: s.status,
                        riskLevel: s.riskLevel,
                        aggregateFreshnessScore: s.aggregateFreshnessScore,
                        totalClaims: s.pipeline?.totalClaims || 0,
                        staleClaims: s.pipeline?.staleClaims || 0,
                        processingTimeMs: s.processingTimeMs,
                        reportId: s.reportId?.toString(),
                        title: (s.originalAnswer || '').slice(0, 60) + '...',
                        topic: s.context?.topic,
                        createdAt: s.createdAt,
                    })),
                    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
                },
            });
            return;
        }
        catch {
            // Fall through to in-memory
        }
    }
    const allSessions = sessionStore_1.inMemoryStore.listSessions(userId);
    let filtered = allSessions;
    if (riskLevel && riskLevel !== 'ALL') {
        filtered = filtered.filter((s) => s.riskLevel === riskLevel);
    }
    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter((s) => (s.originalAnswer && s.originalAnswer.toLowerCase().includes(q)) ||
            (s.context?.topic && s.context.topic.toLowerCase().includes(q)));
    }
    if (sortBy === 'score_desc') {
        filtered.sort((a, b) => (b.aggregateFreshnessScore || 0) - (a.aggregateFreshnessScore || 0));
    }
    else if (sortBy === 'score_asc') {
        filtered.sort((a, b) => (a.aggregateFreshnessScore || 0) - (b.aggregateFreshnessScore || 0));
    }
    else if (sortBy === 'date_asc') {
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    else {
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    const total = filtered.length;
    const sliced = filtered.slice((page - 1) * limit, page * limit);
    res.json({
        success: true,
        data: {
            sessions: sliced.map((s) => ({
                id: s.id,
                sessionId: s.id,
                status: s.status,
                riskLevel: s.riskLevel,
                aggregateFreshnessScore: s.aggregateFreshnessScore,
                totalClaims: s.pipeline?.totalClaims || 0,
                staleClaims: s.pipeline?.staleClaims || 0,
                processingTimeMs: s.processingTimeMs,
                reportId: s.reportId,
                title: (s.originalAnswer || '').slice(0, 60) + '...',
                topic: s.context?.topic,
                createdAt: s.createdAt,
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
    });
    return;
});
/**
 * GET /api/v1/history/analytics
 */
exports.getAnalytics = (0, asyncWrapper_1.asyncWrapper)(async (req, res) => {
    const userId = req.userId;
    if ((0, sessionStore_1.isMongoConnected)()) {
        try {
            const [totalVerifications, riskDistribution, avgScore, recentSessions] = await Promise.all([
                VerificationSession_1.VerificationSession.countDocuments({ status: 'COMPLETE' }),
                VerificationSession_1.VerificationSession.aggregate([
                    { $match: { status: 'COMPLETE' } },
                    { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
                ]),
                VerificationSession_1.VerificationSession.aggregate([
                    { $match: { status: 'COMPLETE' } },
                    { $group: { _id: null, avg: { $avg: '$aggregateFreshnessScore' } } },
                ]),
                VerificationSession_1.VerificationSession.find({ status: 'COMPLETE' })
                    .sort({ createdAt: -1 })
                    .limit(30)
                    .select('aggregateFreshnessScore createdAt')
                    .lean(),
            ]);
            const riskMap = {
                FRESH: 0,
                STALE: 0,
                OUTDATED: 0,
                UNVERIFIABLE: 0,
            };
            for (const r of riskDistribution) {
                if (r._id)
                    riskMap[r._id] = r.count;
            }
            // Calculate pipeline aggregates
            const allCompleteSessions = await VerificationSession_1.VerificationSession.find({ status: 'COMPLETE' })
                .select('pipeline aggregateFreshnessScore createdAt')
                .lean();
            let claimsAnalyzed = 0;
            let outdatedClaims = 0;
            let supportedClaims = 0;
            let unverifiedClaims = 0;
            const freshnessBuckets = {
                '0-20': 0,
                '21-40': 0,
                '41-60': 0,
                '61-80': 0,
                '81-100': 0,
            };
            const dateMap = new Map();
            for (const s of allCompleteSessions) {
                const p = s.pipeline || {};
                claimsAnalyzed += p.totalClaims || 0;
                outdatedClaims += p.staleClaims || 0;
                supportedClaims += (p.staticClaims || 0);
                unverifiedClaims += p.unverifiableClaims || 0;
                const score = s.aggregateFreshnessScore || 0;
                if (score <= 20)
                    freshnessBuckets['0-20']++;
                else if (score <= 40)
                    freshnessBuckets['21-40']++;
                else if (score <= 60)
                    freshnessBuckets['41-60']++;
                else if (score <= 80)
                    freshnessBuckets['61-80']++;
                else
                    freshnessBuckets['81-100']++;
                const dStr = s.createdAt.toISOString().split('T')[0];
                const entry = dateMap.get(dStr) || { count: 0, totalScore: 0 };
                entry.count += 1;
                entry.totalScore += score;
                dateMap.set(dStr, entry);
            }
            const statusDistribution = [
                { name: 'Supported', value: supportedClaims, color: '#10b981' },
                { name: 'Outdated', value: outdatedClaims, color: '#f43f5e' },
                { name: 'Unverified', value: unverifiedClaims, color: '#94a3b8' },
            ];
            const freshnessDistribution = Object.entries(freshnessBuckets).map(([range, count]) => ({
                range,
                count,
            }));
            const activityOverTime = Array.from(dateMap.entries()).map(([date, data]) => ({
                date,
                count: data.count,
                avgScore: Math.round(data.totalScore / data.count),
            }));
            res.json({
                success: true,
                data: {
                    totalVerifications,
                    claimsAnalyzed,
                    outdatedClaims,
                    supportedClaims,
                    unverifiedClaims,
                    averageFreshnessScore: parseFloat((avgScore[0]?.avg ?? 0).toFixed(1)),
                    activityOverTime,
                    statusDistribution,
                    freshnessDistribution,
                    riskDistribution: riskMap,
                    scoreOverTime: recentSessions.reverse().map((s) => ({
                        date: s.createdAt.toISOString().split('T')[0],
                        score: s.aggregateFreshnessScore,
                    })),
                },
            });
            return;
        }
        catch {
            // Fall through to in-memory
        }
    }
    const inMemAnalytics = sessionStore_1.inMemoryStore.getAnalytics(userId);
    res.json({
        success: true,
        data: inMemAnalytics,
    });
    return;
});
//# sourceMappingURL=historyController.js.map