import apiClient from './apiClient';
import { ApiResponse } from '../types/api.types';
import { ExtractedClaim } from './claimService';

export type FreshnessPriority = 'HIGH' | 'MEDIUM' | 'LOW' | 'STABLE';

export type VolatilityLevel = 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'STABLE';

export type VerificationDecision =
  | 'VERIFY_IMMEDIATELY'
  | 'VERIFY_LIVE'
  | 'VERIFY_IF_NEEDED'
  | 'NOT_REQUIRED';

export type RecommendedSearchStrategy =
  | 'OFFICIAL_RELEASE_SEARCH'
  | 'LEADERSHIP_EXECUTIVE_SEARCH'
  | 'REALTIME_FINANCIAL_LOOKUP'
  | 'GOVERNMENT_REGULATION_SEARCH'
  | 'ACADEMIC_DEADLINE_SEARCH'
  | 'GENERAL_WEB_SEARCH'
  | 'SKIP_VERIFICATION';

export interface ClaimTemporalAnalysis {
  claimId: string;
  claimText: string;
  isTimeSensitive: boolean;
  priority: FreshnessPriority;
  volatility: VolatilityLevel;
  decision: VerificationDecision;
  requiresVerification: boolean;
  category: string;
  reason: string;
  recommendedSearchStrategy: RecommendedSearchStrategy;
  preferredSourceType: string;
  detectionMethod: 'BIFROST_SEMANTIC' | 'DETERMINISTIC_RULES' | 'HYBRID';
  confidence: number;
}

export interface FreshnessAnalysisResponse {
  verificationId: string;
  totalClaims: number;
  timeSensitiveCount: number;
  stableCount: number;
  analysis: ClaimTemporalAnalysis[];
  model: string;
  latencyMs: number;
}

export const freshnessService = {
  /**
   * Run freshness and temporal intelligence analysis on claims or answer text.
   */
  async analyzeFreshness(params: {
    verificationId?: string;
    claims?: ExtractedClaim[];
    answerText?: string;
    topicHint?: string;
    model?: string;
  }): Promise<FreshnessAnalysisResponse> {
    const res = await apiClient.post<ApiResponse<FreshnessAnalysisResponse>>(
      '/freshness/analyze',
      params,
    );
    return res.data?.data || (res.data as any);
  },

  /**
   * Retrieve temporal analysis for a verification session.
   */
  async getFreshnessByVerificationId(
    verificationId: string,
  ): Promise<FreshnessAnalysisResponse> {
    const res = await apiClient.get<ApiResponse<FreshnessAnalysisResponse>>(
      `/freshness/${verificationId}`,
    );
    return res.data?.data || (res.data as any);
  },
};
