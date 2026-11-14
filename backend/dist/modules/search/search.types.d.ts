import { AuthorityTier } from '../../types/verification.types';
export type SourceType = 'official_documentation' | 'government' | 'academic' | 'company_official' | 'established_news' | 'community' | 'general';
export interface TavilyRawResult {
    title: string;
    url: string;
    content: string;
    score: number;
    published_date?: string;
    raw_content?: string;
}
export interface TavilySearchResponse {
    query: string;
    results: TavilyRawResult[];
    response_time: number;
    request_id?: string;
    answer?: string;
}
export interface SearchOptions {
    query: string;
    searchDepth?: 'basic' | 'advanced';
    topic?: 'general' | 'news' | 'finance';
    maxResults?: number;
    includeAnswer?: boolean;
    includeRawContent?: boolean;
    includeDomains?: string[];
    excludeDomains?: string[];
    timeRange?: 'day' | 'week' | 'month' | 'year';
}
export interface NormalizedEvidence {
    sourceTitle: string;
    sourceUrl: string;
    sourceDomain: string;
    content: string;
    publishedAt: string | null;
    retrievedAt: string;
    relevanceScore: number;
    authorityScore: number;
    authorityTier: AuthorityTier;
    sourceType: SourceType;
    usedInAnalysis: boolean;
    claimId?: string;
    sessionId?: string;
}
export interface ClaimSearchResult {
    claimText: string;
    searchQuery: string;
    evidence: NormalizedEvidence[];
    searchTimeMs: number;
    cached: boolean;
    totalFound: number;
}
//# sourceMappingURL=search.types.d.ts.map