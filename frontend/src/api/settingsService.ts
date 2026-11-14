import apiClient from './apiClient';
import { ApiResponse } from '../types/api.types';

export type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONFIGURATION_REQUIRED' | 'ERROR';
export type BifrostStatus = IntegrationStatus;
export type TavilyStatus = IntegrationStatus;

export interface BifrostHealthDetails {
  status: BifrostStatus;
  latencyMs: number;
  url: string;
  model: string;
  availableModels: string[];
  error?: string;
  lastChecked: string;
}

export interface TavilyHealthDetails {
  status: TavilyStatus;
  latencyMs: number;
  plan: string;
  error?: string;
  lastChecked: string;
}

export interface IntegrationHealth {
  bifrost: BifrostHealthDetails;
  tavily: TavilyHealthDetails;
  database: {
    status: 'connected' | 'disconnected';
  };
}

export const settingsService = {
  /**
   * Check live Bifrost gateway health from backend endpoint.
   */
  async getBifrostHealth(): Promise<BifrostHealthDetails> {
    try {
      const res = await apiClient.get<ApiResponse<any>>('/integrations/bifrost/health');
      const data = res.data?.data || res.data;
      return {
        status: data?.status || 'DISCONNECTED',
        latencyMs: data?.latencyMs || 0,
        url: data?.url || 'http://localhost:8080/v1',
        model: data?.model || 'openai/gpt-4o',
        availableModels: data?.availableModels || [],
        error: data?.error,
        lastChecked: new Date().toLocaleTimeString(),
      };
    } catch (err: any) {
      return {
        status: 'ERROR',
        latencyMs: 0,
        url: 'http://localhost:8080/v1',
        model: 'openai/gpt-4o',
        availableModels: [],
        error: err.response?.data?.error?.message || err.message,
        lastChecked: new Date().toLocaleTimeString(),
      };
    }
  },

  /**
   * Check live Tavily Search health from backend endpoint.
   */
  async getTavilyHealth(): Promise<TavilyHealthDetails> {
    try {
      const res = await apiClient.get<ApiResponse<any>>('/integrations/tavily/health');
      const data = res.data?.data || res.data;
      return {
        status: data?.status || 'CONFIGURATION_REQUIRED',
        latencyMs: data?.latencyMs || 0,
        plan: data?.plan || 'Demo / Live Public Fallback',
        error: data?.error,
        lastChecked: new Date().toLocaleTimeString(),
      };
    } catch (err: any) {
      return {
        status: 'ERROR',
        latencyMs: 0,
        plan: 'Error',
        error: err.response?.data?.error?.message || err.message,
        lastChecked: new Date().toLocaleTimeString(),
      };
    }
  },

  /**
   * Check overall integration health status.
   */
  async getIntegrationHealth(): Promise<IntegrationHealth> {
    const [bifrost, tavily] = await Promise.all([
      this.getBifrostHealth(),
      this.getTavilyHealth(),
    ]);

    return {
      bifrost,
      tavily,
      database: {
        status: 'connected',
      },
    };
  },
};
