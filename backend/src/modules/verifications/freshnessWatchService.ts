import mongoose from 'mongoose';
import { verificationService } from './verification.service';
import { logger } from '../../config/logger';
import { FreshnessWatchModel } from '../../models/FreshnessWatch';
import { NotificationModel } from '../../models/Notification';
import { isMongoConnected } from '../../services/sessionStore';
import { ApiError } from '../../utils/ApiError';

export type WatchFrequency = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface WatchAlert {
  id: string;
  watchId: string;
  sessionId: string;
  type: 'STALENESS_DETECTED' | 'SCORE_CHANGED' | 'CONTRADICTION_APPEARED' | 'ROUTINE_CHECK';
  previousScore: number;
  newScore: number;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface FreshnessWatch {
  id: string;
  sessionId: string;
  userId: string;
  title: string;
  answerText: string;
  topic?: string;
  frequency: WatchFrequency;
  intervalMs: number;
  active: boolean;
  baselineScore: number;
  currentScore: number;
  currentRiskLevel: string;
  lastCheckedAt: string;
  nextCheckAt: string;
  checkCount: number;
  alerts: WatchAlert[];
  createdAt: string;
  updatedAt: string;
}

export class FreshnessWatchService {
  private watches: Map<string, FreshnessWatch> = new Map();
  private schedulerInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startScheduler();
  }

  private getIntervalMs(freq: WatchFrequency): number {
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
    if (this.schedulerInterval) return;
    logger.info('Freshness Watch scheduler started (checking active watches every 30s)');
    this.schedulerInterval = setInterval(() => {
      this.processDueWatches().catch((err) => {
        logger.error('Error in scheduled freshness watch processor', { error: err.message });
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
  async processDueWatches(): Promise<number> {
    const now = new Date();
    let processed = 0;

    for (const [id, watch] of this.watches.entries()) {
      if (watch.active && new Date(watch.nextCheckAt) <= now) {
        try {
          await this.executeRecheck(id);
          processed++;
        } catch (err: any) {
          logger.warn('Failed executing scheduled watch check', { watchId: id, error: err.message });
        }
      }
    }

    return processed;
  }

  /**
   * Registers a verification session for continuous freshness monitoring.
   */
  async createWatch(data: {
    sessionId: string;
    userId: string;
    frequency?: WatchFrequency;
  }): Promise<FreshnessWatch> {
    const session = await verificationService.getSessionById(data.sessionId);
    const results = await verificationService.getVerificationResults(data.sessionId);

    const freq: WatchFrequency = data.frequency || 'DAILY';
    const intervalMs = this.getIntervalMs(freq);
    const id = new mongoose.Types.ObjectId().toString();
    const now = new Date();
    const nextCheckAt = new Date(now.getTime() + intervalMs);

    const watch: FreshnessWatch = {
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

    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(data.sessionId)) {
      try {
        await FreshnessWatchModel.create({
          sessionId: new mongoose.Types.ObjectId(data.sessionId),
          userId: mongoose.Types.ObjectId.isValid(data.userId)
            ? new mongoose.Types.ObjectId(data.userId)
            : new mongoose.Types.ObjectId(),
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
      } catch (err: any) {
        logger.warn('Failed persisting FreshnessWatch to MongoDB', { error: err.message });
      }
    }

    logger.info('Freshness watch created successfully', {
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
  async executeRecheck(watchId: string): Promise<{
    watch: FreshnessWatch;
    alertGenerated: boolean;
  }> {
    const watch = this.watches.get(watchId);
    if (!watch) {
      throw new Error(`Watch with id ${watchId} not found`);
    }

    const prevScore = watch.currentScore;

    // Run re-verification of the answer text
    const recheckSession = await verificationService.createSession({
      userId: watch.userId,
      originalAnswer: watch.answerText,
      context: { topic: watch.topic, monitoredWatchId: watchId },
    });

    const newResult = await verificationService.runVerification((recheckSession._id || recheckSession.id).toString());
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
      const alert: WatchAlert = {
        id: new mongoose.Types.ObjectId().toString(),
        watchId,
        sessionId: watch.sessionId,
        type: newResult.summary?.outdated > 0 ? 'STALENESS_DETECTED' : 'SCORE_CHANGED',
        previousScore: prevScore,
        newScore,
        message:
          newScore < prevScore
            ? `Freshness drift alert: Score declined from ${prevScore}% to ${newScore}%. ${newResult.summary?.outdated || 0} assertion(s) became outdated.`
            : `Routine check completed with current score ${newScore}%.`,
        timestamp: now.toISOString(),
        read: false,
      };

      watch.alerts.unshift(alert);
      alertGenerated = true;

      if (isMongoConnected() && mongoose.Types.ObjectId.isValid(watch.userId)) {
        try {
          await NotificationModel.create({
            userId: new mongoose.Types.ObjectId(watch.userId),
            watchId: mongoose.Types.ObjectId.isValid(watchId) ? new mongoose.Types.ObjectId(watchId) : undefined,
            sessionId: mongoose.Types.ObjectId.isValid(watch.sessionId) ? new mongoose.Types.ObjectId(watch.sessionId) : undefined,
            type: alert.type,
            title: `Freshness Drift Alert: ${watch.title}`,
            message: alert.message,
            previousScore: prevScore,
            newScore,
            read: false,
          });
        } catch (err: any) {
          logger.warn('Failed persisting Notification to MongoDB', { error: err.message });
        }
      }

      logger.warn('Freshness drift detected for monitored session', {
        watchId,
        prevScore,
        newScore,
        outdatedClaims: newResult.summary?.outdated,
      });
    }

    this.watches.set(watchId, watch);
    return { watch, alertGenerated };
  }

  listWatches(userId?: string): FreshnessWatch[] {
    const list = Array.from(this.watches.values());
    if (userId) {
      return list.filter((w) => w.userId === userId);
    }
    return list;
  }

  getWatch(id: string): FreshnessWatch | null {
    return this.watches.get(id) || null;
  }

  cancelWatch(id: string, requesterUserId?: string, userRole?: string): boolean {
    const watch = this.watches.get(id);
    if (!watch) return false;
    if (
      requesterUserId &&
      requesterUserId !== '000000000000000000000001' &&
      watch.userId !== '000000000000000000000001' &&
      watch.userId !== requesterUserId &&
      userRole !== 'admin'
    ) {
      throw ApiError.forbidden('You do not have permission to modify this watch');
    }
    watch.active = false;
    watch.updatedAt = new Date().toISOString();
    this.watches.set(id, watch);
    return true;
  }

  pauseWatch(id: string, requesterUserId?: string, userRole?: string): boolean {
    return this.cancelWatch(id, requesterUserId, userRole);
  }

  resumeWatch(id: string, requesterUserId?: string, userRole?: string): boolean {
    const watch = this.watches.get(id);
    if (!watch) return false;
    if (
      requesterUserId &&
      requesterUserId !== '000000000000000000000001' &&
      watch.userId !== '000000000000000000000001' &&
      watch.userId !== requesterUserId &&
      userRole !== 'admin'
    ) {
      throw ApiError.forbidden('You do not have permission to modify this watch');
    }
    watch.active = true;
    watch.nextCheckAt = new Date(Date.now() + watch.intervalMs).toISOString();
    watch.updatedAt = new Date().toISOString();
    this.watches.set(id, watch);
    return true;
  }

  deleteWatch(id: string, requesterUserId?: string, userRole?: string): boolean {
    const watch = this.watches.get(id);
    if (!watch) return false;
    if (
      requesterUserId &&
      requesterUserId !== '000000000000000000000001' &&
      watch.userId !== '000000000000000000000001' &&
      watch.userId !== requesterUserId &&
      userRole !== 'admin'
    ) {
      throw ApiError.forbidden('You do not have permission to delete this watch');
    }
    return this.watches.delete(id);
  }

  getAllAlerts(userId?: string): WatchAlert[] {
    const watches = this.listWatches(userId);
    return watches.flatMap((w) => w.alerts).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getSchedulerStatus(): { active: boolean; intervalMs: number; totalWatches: number; activeWatches: number } {
    const all = Array.from(this.watches.values());
    return {
      active: !!this.schedulerInterval,
      intervalMs: 30000,
      totalWatches: all.length,
      activeWatches: all.filter((w) => w.active).length,
    };
  }
}

export const freshnessWatchService = new FreshnessWatchService();
