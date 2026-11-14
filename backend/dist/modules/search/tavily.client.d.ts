import { SearchOptions, TavilySearchResponse } from './search.types';
export declare class TavilyClient {
    private httpClient;
    private apiKey;
    private timeoutMs;
    private baseURL;
    constructor();
    /**
     * Health check: verify Tavily API connectivity and credentials
     */
    checkHealth(): Promise<{
        status: 'CONNECTED' | 'DISCONNECTED' | 'CONFIGURATION_REQUIRED' | 'ERROR';
        latencyMs: number;
        plan: string;
        error?: string;
    }>;
    /**
     * Execute live search with Tavily, with automatic public live-web fallback if unauthorized
     */
    search(options: SearchOptions): Promise<TavilySearchResponse>;
    /**
     * Live Public Web Search Engine
     * Retrieves real, timestamped facts directly from authoritative public registries and documentation.
     */
    private livePublicWebSearch;
}
export declare const tavilyClient: TavilyClient;
//# sourceMappingURL=tavily.client.d.ts.map