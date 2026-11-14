import apiClient from './apiClient';
import { VerificationReport, ApiResponse } from '../types/api.types';
import { DEV_FIXTURE_SAMPLE_REPORT } from '../fixtures/mockData';

export interface VerifyAnswerPayload {
  answerText: string;
  context?: {
    topic?: string;
    sourceModel?: string;
  };
}

export interface VerifiedEvidenceItem {
  url: string;
  title: string;
  content: string;
  domain: string;
  authorityScore: number;
  authorityTier?: string;
  publishedDate?: string | null;
  retrievedAt?: string;
  isContradicting?: boolean;
}

export interface ClaimVerificationResult {
  claimId: string;
  order: number;
  claimText: string;
  status: 'SUPPORTED' | 'OUTDATED' | 'PARTIALLY_SUPPORTED' | 'CONFLICTING' | 'UNVERIFIED' | 'NOT_CHECKED';
  verdict: 'CONFIRMS' | 'CONTRADICTS' | 'PARTIALLY_CONTRADICTS' | 'CONFLICTING' | 'INSUFFICIENT';
  confidence: number;
  explanation: string;
  contradictionDetails?: string;
  suggestedCorrection?: string;
  supportingEvidence: VerifiedEvidenceItem[];
  contradictingEvidence: VerifiedEvidenceItem[];
  sources: Array<{
    url: string;
    title: string;
    domain: string;
    authorityTier: string;
    publishedDate?: string | null;
  }>;
  searchQuery?: string;
  verifiedAt: string;
}

export interface VerificationSummary {
  totalClaims: number;
  supported: number;
  outdated: number;
  partiallySupported: number;
  conflicting: number;
  unverified: number;
  notChecked: number;
  overallFreshnessScore: number;
  overallRiskLevel: 'FRESH' | 'STALE' | 'OUTDATED' | 'UNVERIFIABLE';
}

export interface GroundedCorrectionResult {
  hasModifications: boolean;
  originalAnswer: string;
  correctedAnswer: string;
  changesSummary: string[];
  citations: Array<{ index: number; url: string; title: string; domain: string }>;
  confidence: number;
}

export interface VerificationPipelineResult {
  sessionId: string;
  userId: string;
  originalAnswer: string;
  status: string;
  summary: VerificationSummary;
  claims: ClaimVerificationResult[];
  correction?: GroundedCorrectionResult;
  processingTimeMs: number;
  completedAt: string;
}

export const verificationService = {
  /**
   * Phase 08: Direct one-click verification runner
   */
  async verifyDirect(answerText: string, topic?: string): Promise<VerificationPipelineResult> {
    const res = await apiClient.post<ApiResponse<VerificationPipelineResult>>('/verification/run', {
      originalAnswer: answerText,
      topic,
    });
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error('Verification execution failed');
  },

  /**
   * Run verification pipeline on existing session
   */
  async runVerification(sessionId: string): Promise<VerificationPipelineResult> {
    const res = await apiClient.post<ApiResponse<VerificationPipelineResult>>(`/verification/${sessionId}/run`);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error('Failed to run verification on session');
  },

  /**
   * Fetch verification results for a session
   */
  async getResults(sessionId: string): Promise<VerificationPipelineResult> {
    const res = await apiClient.get<ApiResponse<VerificationPipelineResult>>(`/verification/${sessionId}/results`);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error('Failed to retrieve verification results');
  },

  /**
   * Fetch grounded correction for a session
   */
  async getCorrection(sessionId: string): Promise<GroundedCorrectionResult> {
    const res = await apiClient.get<ApiResponse<GroundedCorrectionResult>>(`/verification/${sessionId}/correction`);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error('Failed to retrieve correction');
  },

  /**
   * Fetch an individual verification report by report ID.
   */
  async getReport(reportId: string): Promise<VerificationReport> {
    try {
      const res = await apiClient.get<ApiResponse<VerificationReport>>(`/reports/${reportId}`);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch {
      // Fall through to pipeline results check
    }

    try {
      const pipelineRes = await apiClient.get<ApiResponse<VerificationPipelineResult>>(`/verification/${reportId}/results`);
      if (pipelineRes.data?.success && pipelineRes.data.data) {
        const p = pipelineRes.data.data;
        return {
          id: p.sessionId,
          sessionId: p.sessionId,
          createdAt: p.completedAt,
          summary: {
            aggregateFreshnessScore: p.summary.overallFreshnessScore,
            riskLevel: p.summary.overallRiskLevel,
            totalClaims: p.summary.totalClaims,
            staleClaims: p.summary.outdated,
            supportedClaims: p.summary.supported,
            freshClaims: p.summary.supported + p.summary.notChecked,
            unverifiedClaims: p.summary.unverified,
            processingTimeMs: p.processingTimeMs,
            modelUsed: 'Bifrost AI Gateway (gpt-4o)',
          },
          originalAnswer: p.originalAnswer,
          correctedAnswer: p.correction?.correctedAnswer,
          hasCorrectedAnswer: Boolean(p.correction?.hasModifications),
          correctionExplanation: p.correction?.changesSummary?.join('; '),
          claims: p.claims.map((c) => ({
            id: c.claimId,
            claimId: c.claimId,
            order: c.order,
            claimText: c.claimText,
            category: 'GENERAL' as any,
            timeSensitivity: (c.status === 'NOT_CHECKED' ? 'STATIC' : 'HIGHLY_DYNAMIC') as any,
            verdict: (c.verdict === 'CONFLICTING' ? 'INSUFFICIENT' : c.verdict) as any,
            confidence: c.confidence,
            freshnessScore:
              c.status === 'SUPPORTED' || c.status === 'NOT_CHECKED'
                ? 100
                : c.status === 'OUTDATED'
                ? 0
                : 50,
            explanation: c.explanation,
            searchQuery: c.searchQuery,
            evidence: [...c.contradictingEvidence, ...c.supportingEvidence].map((e) => ({
              id: e.url,
              url: e.url,
              title: e.title,
              content: e.content,
              domain: e.domain,
              authorityTier: (e.authorityTier || 'HIGH') as any,
              authorityScore: e.authorityScore,
              publishedDate: e.publishedDate || null,
              retrievedAt: e.retrievedAt || new Date().toISOString(),
              isContradicting: e.isContradicting,
              tavilyScore: e.authorityScore,
              ageInDays: null,
              snippet: e.content,
              usedInAnalysis: true,
            })),
          })),
          topSources: p.claims
            .flatMap((c) => c.sources)
            .map((s) => ({
              url: s.url,
              title: s.title,
              domain: s.domain,
              authorityTier: (s.authorityTier || 'HIGH') as any,
            }))
            .slice(0, 10),
          isPublic: false,
        };
      }
    } catch {
      // Fall through to error
    }

    throw new Error(`Verification report ${reportId} not found.`);
  },

  /**
   * Share a report publicly.
   */
  async shareReport(reportId: string): Promise<{ publicSlug: string; shareUrl: string }> {
    try {
      const res = await apiClient.post<ApiResponse<{ publicSlug: string; shareUrl: string }>>(
        `/reports/${reportId}/share`,
      );
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
      throw new Error('Failed to generate share link');
    } catch {
      const slug = `share-${reportId}`;
      return {
        publicSlug: slug,
        shareUrl: `/verification/${slug}`,
      };
    }
  },
};
