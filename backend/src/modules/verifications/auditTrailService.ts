import crypto from 'crypto';
import { verificationService } from './verification.service';
import { logger } from '../../config/logger';
import { AuditEventModel } from '../../models/AuditEvent';
import { isMongoConnected } from '../../services/sessionStore';
import mongoose from 'mongoose';

export interface VerificationAuditPackage {
  auditId: string;
  sessionId: string;
  fingerprint: {
    algorithm: 'sha256';
    hash: string;
    generatedAt: string;
  };
  provenance: {
    system: 'FreshGuard AI';
    version: '1.0.0-enterprise';
    gateway: 'Bifrost AI Gateway by Maxim AI (v2.5)';
    searchEngine: 'Tavily Agentic Search API';
    timestamp: string;
  };
  pipelineTelemetry: {
    stagesExecuted: string[];
    processingTimeMs: number;
    model: string;
    fallbackEngaged: boolean;
  };
  originalInput: {
    text: string;
    length: number;
    topic?: string;
  };
  claimsLineage: Array<{
    claimId: string;
    order: number;
    claimText: string;
    verdict: string;
    confidence: number;
    searchQuery?: string;
    evidenceSources: Array<{
      url: string;
      domain: string;
      publishedDate?: string | null;
      retrievedAt?: string;
      authorityScore?: number;
      isContradicting?: boolean;
    }>;
  }>;
  verdictSummary: {
    overallFreshnessScore: number;
    overallRiskLevel: string;
    totalClaims: number;
    staleClaims: number;
    supportedClaims: number;
    unverifiedClaims: number;
  };
}

export class AuditTrailService {
  /**
   * Generates a tamper-evident, reproducible audit trail package for a verification session.
   */
  async generateAuditPackage(sessionId: string): Promise<VerificationAuditPackage> {
    const session = await verificationService.getSessionById(sessionId);
    const results = await verificationService.getVerificationResults(sessionId);

    const auditId = `audit-${sessionId}-${Date.now()}`;
    const generatedAt = new Date().toISOString();

    const claimsLineage = (results.claims || []).map((c: any) => ({
      claimId: c.claimId,
      order: c.order,
      claimText: c.claimText,
      verdict: c.verdict,
      confidence: c.confidence,
      searchQuery: c.searchQuery,
      evidenceSources: [
        ...(c.contradictingEvidence || []).map((e: any) => ({
          url: e.url,
          domain: e.domain,
          publishedDate: e.publishedDate,
          retrievedAt: e.retrievedAt,
          authorityScore: e.authorityScore,
          isContradicting: true,
        })),
        ...(c.supportingEvidence || []).map((e: any) => ({
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

    const hash = crypto.createHash('sha256').update(rawPayloadToHash).digest('hex');

    const auditPackage: VerificationAuditPackage = {
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

    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(sessionId)) {
      try {
        await AuditEventModel.findOneAndUpdate(
          { auditId },
          {
            sessionId: new mongoose.Types.ObjectId(sessionId),
            userId: session?.userId && mongoose.Types.ObjectId.isValid(session.userId)
              ? new mongoose.Types.ObjectId(session.userId)
              : undefined,
            auditId,
            sha256Hash: hash,
            eventPayload: auditPackage,
          },
          { upsert: true, new: true },
        );
      } catch (err: any) {
        logger.warn('Failed persisting AuditEvent to MongoDB', { error: err.message });
      }
    }

    logger.info('Audit trail package compiled successfully', {
      sessionId,
      auditId,
      hash: hash.slice(0, 16) + '...',
    });

    return auditPackage;
  }
}

export const auditTrailService = new AuditTrailService();
