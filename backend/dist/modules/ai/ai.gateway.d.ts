import { GatewayRequestOptions, GatewayResponse } from './ai.types';
export declare class AIGateway {
    private client;
    private baseURL;
    private apiKey;
    private defaultModel;
    private fallbackModel;
    private timeoutMs;
    constructor();
    /**
     * Health Check: tests connectivity to the Bifrost Gateway instance
     */
    checkHealth(): Promise<{
        status: 'CONNECTED' | 'DISCONNECTED' | 'CONFIGURATION_REQUIRED' | 'ERROR';
        latencyMs: number;
        url: string;
        model: string;
        availableModels: string[];
        error?: string;
    }>;
    /**
     * Core request dispatcher with retry, timeout, fallback, and observability
     */
    request(options: GatewayRequestOptions): Promise<GatewayResponse>;
    /**
     * Deterministic AI Engine for resilient validation when external provider key is unconfigured
     */
    private executeFallbackEngine;
    /**
     * Persist execution log to MongoDB / in-memory store
     */
    private logExecution;
}
export declare const aiGateway: AIGateway;
//# sourceMappingURL=ai.gateway.d.ts.map