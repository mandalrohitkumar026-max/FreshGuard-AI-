export type FreshnessPriority = 'HIGH' | 'MEDIUM' | 'LOW' | 'STABLE';
export type VolatilityLevel = 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'STABLE';
export type VerificationDecision = 'VERIFY_IMMEDIATELY' | 'VERIFY_LIVE' | 'VERIFY_IF_NEEDED' | 'NOT_REQUIRED';
export type RecommendedSearchStrategy = 'OFFICIAL_RELEASE_SEARCH' | 'LEADERSHIP_EXECUTIVE_SEARCH' | 'REALTIME_FINANCIAL_LOOKUP' | 'GOVERNMENT_REGULATION_SEARCH' | 'ACADEMIC_DEADLINE_SEARCH' | 'GENERAL_WEB_SEARCH' | 'SKIP_VERIFICATION';
export type DetectionMethod = 'BIFROST_SEMANTIC' | 'DETERMINISTIC_RULES' | 'HYBRID';
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
    detectionMethod: DetectionMethod;
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
export interface FreshnessAnalysisOptions {
    verificationId?: string;
    userId?: string;
    model?: string;
    persistToDb?: boolean;
}
//# sourceMappingURL=freshness.types.d.ts.map