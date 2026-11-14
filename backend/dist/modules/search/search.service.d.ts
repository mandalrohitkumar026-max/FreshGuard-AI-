import { NormalizedEvidence, ClaimSearchResult, SourceType, TavilyRawResult } from './search.types';
export declare class SearchService {
    /**
     * INTELLIGENT QUERY GENERATOR
     * Transforms a raw factual claim into a high-precision, entity-focused search query.
     */
    generateSearchQuery(claimText: string, topicHint?: string): string;
    /**
     * Classify source reliability, domain authority, and source type
     */
    classifySource(url: string, title?: string): {
        sourceDomain: string;
        sourceType: SourceType;
        authorityScore: number;
        authorityTier: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
    };
    /**
     * EVIDENCE NORMALIZER
     * Standardizes raw Tavily result into a validated, structured evidence object.
     */
    normalizeEvidence(raw: TavilyRawResult, claimId?: string, sessionId?: string): NormalizedEvidence;
    /**
     * Search and retrieve live evidence for a specific factual claim.
     */
    searchCurrentEvidence(claimText: string, options?: {
        topicHint?: string;
        searchDepth?: 'basic' | 'advanced';
        maxResults?: number;
        sessionId?: string;
        claimId?: string;
    }): Promise<ClaimSearchResult>;
    /**
     * Search multiple claims in batch
     */
    searchBatch(claims: string[], options?: {
        topicHint?: string;
        searchDepth?: 'basic' | 'advanced';
        maxResults?: number;
        sessionId?: string;
    }): Promise<ClaimSearchResult[]>;
    /**
     * Persist normalized evidence items to MongoDB / inMemoryStore
     */
    private persistEvidence;
    /**
     * Retrieve cached search history
     */
    getSearchHistory(): Array<{
        query: string;
        totalFound: number;
        timestamp: string;
    }>;
}
export declare const searchService: SearchService;
//# sourceMappingURL=search.service.d.ts.map