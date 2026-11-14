import mongoose from 'mongoose';
import {
  RiskLevel,
  SessionStatus,
  TimeSensitivity,
  Verdict,
} from '../types/verification.types';
import { logger } from '../utils/logger';

/**
 * In-Memory Session & Report Store
 *
 * Provides high-availability storage fallback when MongoDB is disconnected.
 * Enables zero-downtime development, automated testing, and demonstration.
 */

class InMemoryStore {
  private sessions: Map<string, any> = new Map();
  private claims: Map<string, any[]> = new Map(); // sessionId -> claims[]
  private evidence: Map<string, any[]> = new Map(); // sessionId -> evidence[]
  private reports: Map<string, any> = new Map(); // reportId -> report

  // ── Sessions ─────────────────────────────────────────────────────────────

  createSession(data: {
    userId: string | mongoose.Types.ObjectId;
    originalAnswer: string;
    context?: any;
    status?: SessionStatus;
  }): any {
    const id = new mongoose.Types.ObjectId().toString();
    const session = {
      _id: id,
      id,
      sessionId: id,
      userId: data.userId.toString(),
      originalAnswer: data.originalAnswer,
      context: data.context || {},
      status: data.status || 'PROCESSING',
      aggregateFreshnessScore: 0,
      riskLevel: 'UNVERIFIABLE' as RiskLevel,
      pipeline: {
        totalClaims: 0,
        staticClaims: 0,
        semiDynamicClaims: 0,
        highlyDynamicClaims: 0,
        staleClaims: 0,
        unverifiableClaims: 0,
      },
      processingTimeMs: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sessions.set(id, session);
    logger.debug('In-Memory session created', { sessionId: id });
    return session;
  }

  getSession(id: string): any | null {
    return this.sessions.get(id) || null;
  }

  updateSession(id: string, updates: Partial<any>): any | null {
    const session = this.sessions.get(id);
    if (!session) return null;
    const updated = {
      ...session,
      ...updates,
      pipeline: {
        ...session.pipeline,
        ...(updates.pipeline || {}),
      },
      updatedAt: new Date(),
    };
    this.sessions.set(id, updated);
    return updated;
  }

  listSessions(userId?: string): any[] {
    const list = Array.from(this.sessions.values());
    if (userId) {
      return list.filter((s) => s.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ── Claims ───────────────────────────────────────────────────────────────

  saveClaim(sessionId: string, claimData: any): any {
    const id = new mongoose.Types.ObjectId().toString();
    const claim = {
      _id: id,
      id,
      sessionId,
      ...claimData,
      createdAt: new Date(),
    };
    const existing = this.claims.get(sessionId) || [];
    existing.push(claim);
    this.claims.set(sessionId, existing);
    return claim;
  }

  saveClaims(sessionId: string, claimsList: any[]): void {
    for (const c of claimsList) {
      this.saveClaim(sessionId, c);
    }
  }

  getClaims(sessionId: string): any[] {
    return this.claims.get(sessionId) || [];
  }

  updateClaim(sessionId: string, claimId: string, updates: any): void {
    const claims = this.claims.get(sessionId) || [];
    const index = claims.findIndex((c) => c.id === claimId || c._id === claimId);
    if (index !== -1) {
      claims[index] = { ...claims[index], ...updates };
      this.claims.set(sessionId, claims);
    }
  }

  // ── Evidence ─────────────────────────────────────────────────────────────

  saveEvidence(sessionId: string, evidenceItems: any[]): void {
    const existing = this.evidence.get(sessionId) || [];
    const stamped = evidenceItems.map((e) => ({
      _id: new mongoose.Types.ObjectId().toString(),
      sessionId,
      ...e,
      createdAt: new Date(),
    }));
    this.evidence.set(sessionId, [...existing, ...stamped]);
  }

  getEvidence(sessionId: string): any[] {
    return this.evidence.get(sessionId) || [];
  }

  // ── Reports ──────────────────────────────────────────────────────────────

  saveReport(reportData: any): any {
    const id = reportData._id ? reportData._id.toString() : new mongoose.Types.ObjectId().toString();
    const report = {
      _id: id,
      id,
      reportId: id,
      ...reportData,
      createdAt: new Date(),
    };
    this.reports.set(id, report);
    if (report.publicSlug) {
      this.reports.set(report.publicSlug, report);
    }
    logger.info('In-Memory report saved', { reportId: id });
    return report;
  }

  getReport(idOrSlug: string): any | null {
    return this.reports.get(idOrSlug) || null;
  }

  listReports(userId?: string): any[] {
    const list = Array.from(this.reports.values());
    if (userId) {
      return list.filter((r) => r.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ── Analytics ────────────────────────────────────────────────────────────

  getAnalytics(userId?: string) {
    const sessions = this.listSessions(userId).filter((s) => s.status === 'COMPLETE');
    const totalVerifications = sessions.length;
    const avgScore =
      totalVerifications > 0
        ? Math.round(sessions.reduce((acc, s) => acc + (s.aggregateFreshnessScore || 0), 0) / totalVerifications)
        : 0;

    let claimsAnalyzed = 0;
    let outdatedClaims = 0;
    let supportedClaims = 0;
    let unverifiedClaims = 0;

    for (const s of sessions) {
      const p = s.pipeline || {};
      claimsAnalyzed += p.totalClaims || 0;
      outdatedClaims += p.staleClaims || 0;
      supportedClaims += (p.staticClaims || 0);
      unverifiedClaims += p.unverifiableClaims || 0;
    }

    // Status distribution
    const statusDistribution = [
      { name: 'Supported', value: supportedClaims, color: '#10b981' },
      { name: 'Outdated', value: outdatedClaims, color: '#f43f5e' },
      { name: 'Unverified', value: unverifiedClaims, color: '#94a3b8' },
    ];

    // Freshness distribution buckets
    const freshnessBuckets: Record<string, number> = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };
    for (const s of sessions) {
      const score = s.aggregateFreshnessScore || 0;
      if (score <= 20) freshnessBuckets['0-20']++;
      else if (score <= 40) freshnessBuckets['21-40']++;
      else if (score <= 60) freshnessBuckets['41-60']++;
      else if (score <= 80) freshnessBuckets['61-80']++;
      else freshnessBuckets['81-100']++;
    }
    const freshnessDistribution = Object.entries(freshnessBuckets).map(([range, count]) => ({
      range,
      count,
    }));

    // Activity over time
    const dateMap = new Map<string, { count: number; totalScore: number }>();
    for (const s of sessions) {
      const dateStr = new Date(s.createdAt).toISOString().split('T')[0];
      const entry = dateMap.get(dateStr) || { count: 0, totalScore: 0 };
      entry.count += 1;
      entry.totalScore += s.aggregateFreshnessScore || 0;
      dateMap.set(dateStr, entry);
    }
    const activityOverTime = Array.from(dateMap.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      avgScore: Math.round(data.totalScore / data.count),
    }));

    const riskDistribution = {
      FRESH: sessions.filter((s) => s.riskLevel === 'FRESH').length,
      STALE: sessions.filter((s) => s.riskLevel === 'STALE').length,
      OUTDATED: sessions.filter((s) => s.riskLevel === 'OUTDATED').length,
      UNVERIFIABLE: sessions.filter((s) => s.riskLevel === 'UNVERIFIABLE').length,
    };

    const scoreOverTime = sessions.slice(0, 30).map((s) => ({
      date: new Date(s.createdAt).toISOString().split('T')[0],
      score: s.aggregateFreshnessScore,
    })).reverse();

    return {
      totalVerifications,
      claimsAnalyzed,
      outdatedClaims,
      supportedClaims,
      unverifiedClaims,
      averageFreshnessScore: avgScore,
      activityOverTime,
      statusDistribution,
      freshnessDistribution,
      riskDistribution,
      scoreOverTime,
    };
  }
}

export const inMemoryStore = new InMemoryStore();
export const isMongoConnected = () => mongoose.connection.readyState === 1;
