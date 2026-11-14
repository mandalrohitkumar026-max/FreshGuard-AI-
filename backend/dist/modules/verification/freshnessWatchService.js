"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.freshnessWatchService = exports.FreshnessWatchService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const verification_service_1 = require("./verification.service");
const logger_1 = require("../../config/logger");
const FreshnessWatch_1 = require("../../models/FreshnessWatch");
const Notification_1 = require("../../models/Notification");
const sessionStore_1 = require("../../services/sessionStore");
const ApiError_1 = require("../../utils/ApiError");
class FreshnessWatchService {
    watches = new Map();
    schedulerInterval = null;
    constructor() {
        this.startScheduler();
    }
    getIntervalMs(freq) {
        switch (freq) {
            case 'HOURLY':
                return 60 * 60 * 1000;
            case 'DAILY':
                return 24 * 60 * 60 * 1000;
            case 'WEEKLY':
                return 7 * 24 * 60 * 60 * 1000;
            case 'MONTHLY':
                return 30 * 24 * 60 * 60 * 1000;
            default:
                return 24 * 60 * 60 * 1000;
        }
    }
    /**
     * Starts real periodic scheduled processing.
     */
    startScheduler() {
        if (this.schedulerInterval)
            return;
        logger_1.logger.info('Freshness Watch scheduler started (checking active watches every 30s)');
        this.schedulerInterval = setInterval(() => {
            this.processDueWatches().catch((err) => {
                logger_1.logger.error('Error in scheduled freshness watch processor', { error: err.message });
            });
        }, 30000);
    }
    stopScheduler() {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }
    }
    /**
     * Scans for active watches where nextCheckAt <= now and runs re-verification.
     */
    async processDueWatches() {
        const now = new Date();
        let processed = 0;
        for (const [id, watch] of this.watches.entries()) {
            if (watch.active && new Date(watch.nextCheckAt) <= now) {
                try {
                    await this.executeRecheck(id);
                    processed++;
                }
                catch (err) {
                    logger_1.logger.warn('Failed executing scheduled watch check', { watchId: id, error: err.message });
                }
            }
        }
        return processed;
    }
    /**
     * Registers a verification session for continuous freshness monitoring.
     */
    async createWatch(data) {
        const session = await verification_service_1.verificationService.getSessionById(data.sessionId);
        const results = await verification_service_1.verificationService.getVerificationResults(data.sessionId);
        const freq = data.frequency || 'DAILY';
        const intervalMs = this.getIntervalMs(freq);
        const id = new mongoose_1.default.Types.ObjectId().toString();
        const now = new Date();
        const nextCheckAt = new Date(now.getTime() + intervalMs);
        const watch = {
            id,
            sessionId: data.sessionId,
            userId: data.userId,
            title: session?.context?.topic || (session?.originalAnswer || '').slice(0, 50) + '...',
            answerText: session?.originalAnswer || '',
            topic: session?.context?.topic,
            frequency: freq,
            intervalMs,
            active: true,
            baselineScore: results.summary?.overallFreshnessScore ?? 100,
            currentScore: results.summary?.overallFreshnessScore ?? 100,
            currentRiskLevel: results.summary?.overallRiskLevel ?? 'FRESH',
            lastCheckedAt: now.toISOString(),
            nextCheckAt: nextCheckAt.toISOString(),
            checkCount: 1,
            alerts: [],
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
        };
        this.watches.set(id, watch);
        if ((0, sessionStore_1.isMongoConnected)() && mongoose_1.default.Types.ObjectId.isValid(data.sessionId)) {
            try {
                await FreshnessWatch_1.FreshnessWatchModel.create({
                    sessionId: new mongoose_1.default.Types.ObjectId(data.sessionId),
                    userId: mongoose_1.default.Types.ObjectId.isValid(data.userId)
                        ? new mongoose_1.default.Types.ObjectId(data.userId)
                        : new mongoose_1.default.Types.ObjectId(),
                    title: watch.title,
                    answerText: watch.answerText,
                    topic: watch.topic,
                    frequency: freq,
                    intervalMs,
                    active: true,
                    baselineScore: watch.baselineScore,
                    currentScore: watch.currentScore,
                    currentRiskLevel: watch.currentRiskLevel,
                    lastCheckedAt: now,
                    nextCheckAt,
                    checkCount: 1,
                });
            }
            catch (err) {
                logger_1.logger.warn('Failed persisting FreshnessWatch to MongoDB', { error: err.message });
            }
        }
        logger_1.logger.info('Freshness watch created successfully', {
            watchId: id,
            sessionId: data.sessionId,
            frequency: freq,
            nextCheckAt: watch.nextCheckAt,
        });
        return watch;
    }
    /**
     * Executes a live re-verification check for a watch, compares evidence,
     * and dispatches alerts if changes occur.
     */
    async executeRecheck(watchId) {
        const watch = this.watches.get(watchId);
        if (!watch) {
            throw new Error(`Watch with id ${watchId} not found`);
        }
        const prevScore = watch.currentScore;
        // Run re-verification of the answer text
        const recheckSession = await verification_service_1.verificationService.createSession({
            userId: watch.userId,
            originalAnswer: watch.answerText,
            context: { topic: watch.topic, monitoredWatchId: watchId },
        });
        const newResult = await verification_service_1.verificationService.runVerification((recheckSession._id || recheckSession.id).toString());
        const newScore = newResult.summary?.overallFreshnessScore ?? prevScore;
        const newRisk = newResult.summary?.overallRiskLevel ?? watch.currentRiskLevel;
        const now = new Date();
        watch.lastCheckedAt = now.toISOString();
        watch.nextCheckAt = new Date(now.getTime() + watch.intervalMs).toISOString();
        watch.checkCount += 1;
        watch.currentScore = newScore;
        watch.currentRiskLevel = newRisk;
        watch.updatedAt = now.toISOString();
        let alertGenerated = false;
        // Detect status shift or score drop
        if (newScore < prevScore || newResult.summary?.outdated > 0) {
            const alert = {
                id: new mongoose_1.default.Types.ObjectId().toString(),
                watchId,
                sessionId: watch.sessionId,
                type: newResult.summary?.outdated > 0 ? 'STALENESS_DETECTED' : 'SCORE_CHANGED',
                previousScore: prevScore,
                newScore,
                message: newScore < prevScore
                    ? `Freshness drift alert: Score declined from ${prevScore}% to ${newScore}%. ${newResult.summary?.outdated || 0} assertion(s) became outdated.`
                    : `Routine check completed with current score ${newScore}%.`,
                timestamp: now.toISOString(),
                read: false,
            };
            watch.alerts.unshift(alert);
            alertGenerated = true;
            if ((0, sessionStore_1.isMongoConnected)() && mongoose_1.default.Types.ObjectId.isValid(watch.userId)) {
                try {
                    await Notification_1.NotificationModel.create({
                        userId: new mongoose_1.default.Types.ObjectId(watch.userId),
                        watchId: mongoose_1.default.Types.ObjectId.isValid(watchId) ? new mongoose_1.default.Types.ObjectId(watchId) : undefined,
                        sessionId: mongoose_1.default.Types.ObjectId.isValid(watch.sessionId) ? new mongoose_1.default.Types.ObjectId(watch.sessionId) : undefined,
                        type: alert.type,
                        title: `Freshness Drift Alert: ${watch.title}`,
                        message: alert.message,
                        previousScore: prevScore,
                        newScore,
                        read: false,
                    });
                }
                catch (err) {
                    logger_1.logger.warn('Failed persisting Notification to MongoDB', { error: err.message });
                }
            }
            logger_1.logger.warn('Freshness drift detected for monitored session', {
                watchId,
                prevScore,
                newScore,
                outdatedClaims: newResult.summary?.outdated,
            });
        }
        this.watches.set(watchId, watch);
        return { watch, alertGenerated };
    }
    listWatches(userId) {
        const list = Array.from(this.watches.values());
        if (userId) {
            return list.filter((w) => w.userId === userId);
        }
        return list;
    }
    getWatch(id) {
        return this.watches.get(id) || null;
    }
    cancelWatch(id, requesterUserId, userRole) {
        const watch = this.watches.get(id);
        if (!watch)
            return false;
        if (requesterUserId &&
            requesterUserId !== '000000000000000000000001' &&
            watch.userId !== '000000000000000000000001' &&
            watch.userId !== requesterUserId &&
            userRole !== 'admin') {
            throw ApiError_1.ApiError.forbidden('You do not have permission to modify this watch');
        }
        watch.active = false;
        watch.updatedAt = new Date().toISOString();
        this.watches.set(id, watch);
        return true;
    }
    pauseWatch(id, requesterUserId, userRole) {
        return this.cancelWatch(id, requesterUserId, userRole);
    }
    resumeWatch(id, requesterUserId, userRole) {
        const watch = this.watches.get(id);
        if (!watch)
            return false;
        if (requesterUserId &&
            requesterUserId !== '000000000000000000000001' &&
            watch.userId !== '000000000000000000000001' &&
            watch.userId !== requesterUserId &&
            userRole !== 'admin') {
            throw ApiError_1.ApiError.forbidden('You do not have permission to modify this watch');
        }
        watch.active = true;
        watch.nextCheckAt = new Date(Date.now() + watch.intervalMs).toISOString();
        watch.updatedAt = new Date().toISOString();
        this.watches.set(id, watch);
        return true;
    }
    deleteWatch(id, requesterUserId, userRole) {
        const watch = this.watches.get(id);
        if (!watch)
            return false;
        if (requesterUserId &&
            requesterUserId !== '000000000000000000000001' &&
            watch.userId !== '000000000000000000000001' &&
            watch.userId !== requesterUserId &&
            userRole !== 'admin') {
            throw ApiError_1.ApiError.forbidden('You do not have permission to delete this watch');
        }
        return this.watches.delete(id);
    }
    getAllAlerts(userId) {
        const watches = this.listWatches(userId);
        return watches.flatMap((w) => w.alerts).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    getSchedulerStatus() {
        const all = Array.from(this.watches.values());
        return {
            active: !!this.schedulerInterval,
            intervalMs: 30000,
            totalWatches: all.length,
            activeWatches: all.filter((w) => w.active).length,
        };
    }
}
exports.FreshnessWatchService = FreshnessWatchService;
exports.freshnessWatchService = new FreshnessWatchService();
//# sourceMappingURL=freshnessWatchService.js.map