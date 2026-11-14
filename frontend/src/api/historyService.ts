import apiClient from './apiClient';
import {
  VerificationSession,
  DashboardStatistics,
  ApiResponse,
} from '../types/api.types';
import {
  DEV_FIXTURE_STATS,
  DEV_FIXTURE_SESSIONS,
} from '../fixtures/mockData';

export interface HistoryFilterParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc';
  page?: number;
  limit?: number;
}

export const historyService = {
  /**
   * Fetch paginated verification sessions with filters.
   */
  async getSessions(params?: HistoryFilterParams): Promise<{
    sessions: VerificationSession[];
    total: number;
    pages: number;
  }> {
    try {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'ALL') query.set('riskLevel', params.status);
      if (params?.search) query.set('search', params.search);
      if (params?.sortBy) query.set('sortBy', params.sortBy);
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));

      const res = await apiClient.get<
        ApiResponse<{ sessions: VerificationSession[]; pagination: { total: number; pages: number } }>
      >(`/history?${query.toString()}`);

      if (res.data?.success && res.data.data) {
        return {
          sessions: res.data.data.sessions || [],
          total: res.data.data.pagination?.total || 0,
          pages: res.data.data.pagination?.pages || 0,
        };
      }
      return { sessions: [], total: 0, pages: 0 };
    } catch {
      return { sessions: [], total: 0, pages: 0 };
    }
  },

  /**
   * Fetch dashboard statistics and metrics.
   */
  async getDashboardStatistics(): Promise<DashboardStatistics> {
    try {
      const res = await apiClient.get<ApiResponse<DashboardStatistics>>('/history/analytics');
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
      throw new Error('Analytics response empty');
    } catch {
      return {
        totalVerifications: 0,
        claimsAnalyzed: 0,
        outdatedClaims: 0,
        supportedClaims: 0,
        unverifiedClaims: 0,
        averageFreshnessScore: 0,
        activityOverTime: [],
        statusDistribution: [],
        freshnessDistribution: [],
      };
    }
  },
};
