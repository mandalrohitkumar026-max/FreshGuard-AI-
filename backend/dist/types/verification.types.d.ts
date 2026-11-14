export type TimeSensitivity = 'STATIC' | 'SEMI_DYNAMIC' | 'HIGHLY_DYNAMIC';
export type Verdict = 'CONFIRMS' | 'CONTRADICTS' | 'PARTIALLY_CONTRADICTS' | 'INSUFFICIENT';
export type RiskLevel = 'FRESH' | 'STALE' | 'OUTDATED' | 'UNVERIFIABLE';
export type SessionStatus = 'PROCESSING' | 'COMPLETE' | 'FAILED' | 'PARTIAL';
export type AuthorityTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
export type PipelineStage = 'ANSWER_PARSING' | 'CLAIM_EXTRACTION' | 'TIME_SENSITIVITY' | 'QUERY_GENERATION' | 'TAVILY_SEARCH' | 'EVIDENCE_VALIDATION' | 'AI_ANALYSIS' | 'SCORING' | 'RISK_CLASSIFICATION' | 'CORRECTION' | 'REPORT_GENERATION';
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        requestId?: string;
        details?: unknown;
    };
}
export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
export interface ExtractedClaim {
    claimText: string;
    order: number;
    timeSensitivity?: TimeSensitivity;
}
export interface TavilyResult {
    title: string;
    url: string;
    content: string;
    score: number;
    raw_content?: string | null;
    published_date?: string | null;
}
export interface TavilySearchResponse {
    query: string;
    results: TavilyResult[];
    answer?: string;
    follow_up_questions?: string[];
}
export interface EvidenceItem {
    url: string;
    title: string;
    content: string;
    domain: string;
    tavilyScore: number;
    authorityTier: AuthorityTier;
    authorityScore: number;
    publishedDate: Date | null;
    ageInDays: number | null;
    usedInAnalysis: boolean;
}
export interface ClaimAnalysisResult {
    verdict: Verdict;
    confidence: number;
    explanation: string;
    supportingEvidenceIndices: number[];
}
export interface ScoredClaim {
    claimText: string;
    order: number;
    timeSensitivity: TimeSensitivity;
    searchQuery: string | null;
    verdict: Verdict;
    confidence: number;
    explanation: string;
    freshnessScore: number;
    evidence: EvidenceItem[];
}
export interface SSEEvent {
    stage: string;
    timestamp: string;
    data?: unknown;
}
export interface JwtPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}
//# sourceMappingURL=verification.types.d.ts.map