export type CanonicalFreshnessInterpretation = 'VERY_FRESH' | 'FRESH' | 'NEEDS_REVIEW' | 'POTENTIALLY_OUTDATED' | 'SEVERELY_OUTDATED';
export type ClaimRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export interface ScoringFactors {
    temporalRelevance: number;
    evidenceRecency: number;
    evidenceQuality: number;
    verificationOutcome: number;
    uncertainty: number;
}
export interface ClaimScoringInput {
    claimId: string;
    order: number;
    claimText: string;
    timeSensitivity: 'STATIC' | 'SEMI_DYNAMIC' | 'HIGHLY_DYNAMIC';
    category?: string;
    verdict: 'CONFIRMS' | 'CONTRADICTS' | 'PARTIALLY_CONTRADICTS' | 'INSUFFICIENT' | 'CONFLICTING';
    status: 'SUPPORTED' | 'OUTDATED' | 'PARTIALLY_SUPPORTED' | 'CONFLICTING' | 'UNVERIFIED' | 'NOT_CHECKED';
    confidence: number;
    explanation?: string;
    evidence: Array<{
        url: string;
        domain: string;
        authorityScore?: number;
        authorityTier?: string;
        publishedDate?: string | null;
        retrievedAt?: string;
        isContradicting?: boolean;
        sourceIntelligence?: any;
    }>;
    conflictAnalysis?: any;
}
export interface ClaimScoringOutput {
    claimId: string;
    order: number;
    claimText: string;
    freshnessScore: number;
    riskLevel: ClaimRiskLevel;
    timeSensitivity: string;
    verificationStatus: string;
    evidenceConfidence: number;
    explanation: string;
    factors: ScoringFactors;
    recommendedAction: string;
    positiveContributions: string[];
    negativeContributions: string[];
}
export interface AnswerScoringOutput {
    overallFreshnessScore: number;
    overallRiskLevel: ClaimRiskLevel;
    freshnessInterpretation: CanonicalFreshnessInterpretation;
    riskExplanation: string;
    explanation: string;
    totalClaims: number;
    supportedClaims: number;
    outdatedClaims: number;
    partiallySupportedClaims: number;
    conflictingClaims: number;
    unverifiedClaims: number;
    claimsNotChecked: number;
    claims: ClaimScoringOutput[];
    scoringConfigVersion: string;
    evaluatedAt: string;
}
//# sourceMappingURL=scoring.types.d.ts.map