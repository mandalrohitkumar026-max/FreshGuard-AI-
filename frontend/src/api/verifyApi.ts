import api from './apiClient';
import { ApiResponse, Report, SessionListItem, AnalyticsData } from '../types/api.types';

export const verifyApi = {
  getSessionStatus: async (sessionId: string) => {
    const res = await api.get(`/verify/${sessionId}`);
    return res.data;
  },
};

export const reportApi = {
  getReport: async (reportId: string) => {
    const res = await api.get<ApiResponse<Report>>(`/reports/${reportId}`);
    return res.data;
  },

  listReports: async (page = 1, limit = 20) => {
    const res = await api.get(`/reports?page=${page}&limit=${limit}`);
    return res.data;
  },

  shareReport: async (reportId: string) => {
    const res = await api.post(`/reports/${reportId}/share`);
    return res.data;
  },
};

export const historyApi = {
  getHistory: async (params?: {
    page?: number;
    limit?: number;
    riskLevel?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.riskLevel) query.set('riskLevel', params.riskLevel);
    const res = await api.get<ApiResponse<{ sessions: SessionListItem[]; pagination: unknown }>>(
      `/history?${query.toString()}`,
    );
    return res.data;
  },

  getAnalytics: async () => {
    const res = await api.get<ApiResponse<AnalyticsData>>('/history/analytics');
    return res.data;
  },
};
