import mongoose from 'mongoose';
import { Report } from './report.model';
import { Claim } from '../claims/claim.model';
import { EvidenceSource } from '../evidence/evidence.model';
import { inMemoryStore } from '../../services/sessionStore';
import { isMongoConnected } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { randomBytes } from 'crypto';

export class ReportService {
  async getReport(reportOrSessionId: string, requesterUserId?: string, requesterUserRole?: string): Promise<any> {
    let report: any = null;

    if (isMongoConnected()) {
      try {
        if (mongoose.Types.ObjectId.isValid(reportOrSessionId)) {
          report = await Report.findOne({
            $or: [{ _id: reportOrSessionId }, { sessionId: reportOrSessionId }],
          }).lean();
        }
      } catch {
        // Fallback
      }
    }

    if (!report) {
      report = inMemoryStore.getReport(reportOrSessionId);
      if (!report) {
        // Maybe it's a sessionId in memory store
        const session = inMemoryStore.getSession(reportOrSessionId);
        if (session && session.reportId) {
          report = inMemoryStore.getReport(session.reportId);
        }
      }
    }

    if (!report) {
      throw ApiError.notFound('Report not found');
    }

    // IDOR Protection: enforce user ownership unless report is explicitly public
    const reportOwner = report.userId ? report.userId.toString() : null;
    const isOwnerRegistered = reportOwner && reportOwner !== '000000000000000000000001';
    if (
      !report.isPublic &&
      isOwnerRegistered &&
      requesterUserId &&
      requesterUserId !== '000000000000000000000001' &&
      reportOwner !== requesterUserId &&
      requesterUserRole !== 'admin'
    ) {
      throw ApiError.forbidden('You do not have permission to access this report');
    }

    // Attach full claims and evidence if available
    let claims: any[] = [];
    if (isMongoConnected() && report.sessionId) {
      try {
        claims = await Claim.find({ sessionId: report.sessionId }).sort({ order: 1 }).lean();
        const evidence = await EvidenceSource.find({ sessionId: report.sessionId }).lean();
        const evidenceMap = new Map<string, any[]>();
        for (const e of evidence) {
          const key = e.claimId ? e.claimId.toString() : '';
          if (!evidenceMap.has(key)) evidenceMap.set(key, []);
          evidenceMap.get(key)!.push(e);
        }
        claims = claims.map((c) => ({
          id: c._id.toString(),
          claimId: c._id.toString(),
          claimText: c.claimText,
          category: (c as any).category || c.timeSensitivity || 'GENERAL',
          timeSensitivity: c.timeSensitivity,
          freshnessScore: c.freshnessScore,
          verdict: c.verdict,
          confidence: c.confidence,
          explanation: c.explanation,
          suggestedCorrection: (c as any).suggestedCorrection,
          searchQuery: c.searchQuery,
          evidence: evidenceMap.get(c._id.toString()) || [],
        }));
      } catch {
        // In-memory fallback
      }
    }

    if (claims.length === 0 && report.sessionId) {
      const memClaims = inMemoryStore.getClaims(report.sessionId.toString());
      const memEvidence = inMemoryStore.getEvidence(report.sessionId.toString());
      claims = memClaims.map((c: any) => ({
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
        evidence: memEvidence.filter((e: any) => e.claimId === (c.id || c._id)),
      }));
    }

    return {
      ...report,
      id: report._id ? report._id.toString() : report.id,
      claims,
    };
  }

  async shareReport(reportId: string): Promise<{ publicSlug: string; shareUrl: string }> {
    const slug = randomBytes(6).toString('hex');

    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(reportId)) {
      try {
        const updated = await Report.findByIdAndUpdate(
          reportId,
          { isPublic: true, publicSlug: slug },
          { new: true },
        ).lean();
        if (updated) {
          return {
            publicSlug: slug,
            shareUrl: `/report/public/${slug}`,
          };
        }
      } catch {
        // Fallback
      }
    }

    const memReport = inMemoryStore.getReport(reportId);
    if (!memReport) {
      throw ApiError.notFound('Report not found');
    }
    memReport.isPublic = true;
    memReport.publicSlug = slug;
    return {
      publicSlug: slug,
      shareUrl: `/report/public/${slug}`,
    };
  }
}

export const reportService = new ReportService();
