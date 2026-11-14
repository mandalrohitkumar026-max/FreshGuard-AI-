import { TavilyResult } from '../types/verification.types';
export interface TavilySearchOptions {
    query: string;
    searchDepth?: 'basic' | 'advanced';
    topic?: 'general' | 'news' | 'finance';
    maxResults?: number;
    includeAnswer?: boolean;
    includeDomains?: string[];
    excludeDomains?: string[];
}
/**
 * Execute a single Tavily search and return filtered results.
 * Gracefully falls back to live web search if Tavily credentials are demo or unauthorized.
 */
export declare function tavilySearch(options: TavilySearchOptions): Promise<TavilyResult[]>;
/**
 * Run multiple Tavily searches in parallel.
 */
export declare function tavilySearchBatch(searches: Array<TavilySearchOptions & {
    claimIndex: number;
}>): Promise<Array<{
    claimIndex: number;
    results: TavilyResult[];
    error?: string;
}>>;
/**
 * Check whether the Tavily API or Live Web Search is reachable.
 */
export declare function checkTavilyHealth(): Promise<{
    ok: boolean;
    latencyMs: number;
}>;
//# sourceMappingURL=tavilyService.d.ts.map