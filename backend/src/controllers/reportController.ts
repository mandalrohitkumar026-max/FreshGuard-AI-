import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncWrapper } from '../utils/asyncWrapper';
import { Report } from '../models/Report';
import { Claim } from '../models/Claim';
import { EvidenceSource } from '../models/EvidenceSource';
import { inMemoryStore, isMongoConnected } from '../services/sessionStore';
import { randomBytes } from 'crypto';

/**
 * GET /api/v1/reports/:reportId
 */
export const getReport = asyncWrapper(async (req: Request, res: Response) => {
  const reportId = String(req.params.reportId);
  const userId = req.userId!;

  let report: any = null;

  if (isMongoConnected()) {
    try {
      report = await Report.findOne({ _id: reportId }).lean();
    } catch {
      report = inMemoryStore.getReport(reportId);
    }
  } else {
    report = inMemoryStore.getReport(reportId);
  }

  if (!report) {
    res.status(404).json({
      success: false,
      error: { code: 'REPORT_NOT_FOUND', message: 'Report not found' },
    });
    return;
  }

  // If in-memory, claims and evidence are already embedded or linked
  let claims: any[] = [];
  if (isMongoConnected() && report.sessionId) {
    try {
      claims = await Claim.find({ sessionId: report.sessionId }).sort({ order: 1 }).lean();
      const evidence = await EvidenceSource.find({ sessionId: report.sessionId }).lean();
      const evidenceMap = new Map<string, any[]>();
      for (const e of evidence) {
        const key = e.claimId.toString();
        if (!evidenceMap.has(key)) evidenceMap.set(key, []);
        evidenceMap.get(key)!.push(e);
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
    } catch {
      claims = report.claims || inMemoryStore.getClaims(report.sessionId?.toString()) || [];
    }
  } else {
    claims = report.claims || inMemoryStore.getClaims(report.sessionId?.toString()) || [];
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
export const listReports = asyncWrapper(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  if (isMongoConnected()) {
    try {
      const skip = (page - 1) * limit;
      const [reports, total] = await Promise.all([
        Report.find({ userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Report.countDocuments({ userId }),
      ]);

      res.json({
        success: true,
        data: {
          reports,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
      });
      return;
    } catch {
      // Fall through to in-memory
    }
  }

  const inMem = inMemoryStore.listReports();
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
export const shareReport = asyncWrapper(async (req: Request, res: Response) => {
  const reportId = String(req.params.reportId);
  const slug = randomBytes(8).toString('hex');

  if (isMongoConnected()) {
    try {
      await Report.findByIdAndUpdate(reportId, { isPublic: true, publicSlug: slug });
    } catch {
      // ignore
    }
  }

  const inMem = inMemoryStore.getReport(reportId);
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
export const getPublicReport = asyncWrapper(async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  let report: any = null;

  if (isMongoConnected()) {
    try {
      report = await Report.findOne({ publicSlug: slug, isPublic: true }).lean();
    } catch {
      report = inMemoryStore.getReport(slug);
    }
  } else {
    report = inMemoryStore.getReport(slug);
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
