import type { EvidenceConflictAnalysis } from './conflictDetectionService';
import type { SourceCredibilityProfile } from '../evidence/sourceIntelligenceService';
export type VerificationStatus = 'SUPPORTED' | 'OUTDATED' | 'PARTIALLY_SUPPORTED' | 'CONFLICTING' | 'UNVERIFIED' | 'NOT_CHECKED';
export type VerificationVerdict = 'CONFIRMS' | 'CONTRADICTS' | 'PARTIALLY_CONTRADICTS' | 'INSUFFICIENT' | 'CONFLICTING';
export interface VerifiedEvidenceItem {
    url: string;
    title: string;
    content: string;
    domain: string;
    authorityScore: number;
    authorityTier?: string;
    publishedDate?: string | null;
    retrievedAt?: string;
    sourceType?: string;
    isContradicting?: boolean;
    sourceIntelligence?: SourceCredibilityProfile;
}
export interface ClaimVerificationResult {
    claimId: string;
    order: number;
    claimText: string;
    status: VerificationStatus;
    verdict: VerificationVerdict;
    confidence: number;
    explanation: string;
    freshnessScore?: number;
    riskLevel?: string;
    timeSensitivity?: string;
    factors?: {
        temporalRelevance: number;
        evidenceRecency: number;
        evidenceQuality: number;
        verificationOutcome: number;
        uncertainty: number;
    };
    recommendedAction?: string;
    positiveContributions?: string[];
    negativeContributions?: string[];
    contradictionDetails?: string;
    suggestedCorrection?: string;
    supportingEvidence: VerifiedEvidenceItem[];
    contradictingEvidence: VerifiedEvidenceItem[];
    conflictAnalysis?: EvidenceConflictAnalysis;
    sources: Array<{
        url: string;
        title: string;
        domain: string;
        authorityTier: string;
        publishedDate?: string | null;
    }>;
    searchQuery?: string;
    verifiedAt: string;
}
export interface VerificationSummary {
    totalClaims: number;
    supported: number;
    outdated: number;
    partiallySupported: number;
    conflicting: number;
    unverified: number;
    notChecked: number;
    overallFreshnessScore: number;
    overallRiskLevel: 'FRESH' | 'STALE' | 'OUTDATED' | 'UNVERIFIABLE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    freshnessInterpretation?: string;
    riskExplanation?: string;
}
export interface GroundedCitation {
    index: number;
    url: string;
    title: string;
    domain: string;
}
export interface GroundedCorrectionResult {
    hasModifications: boolean;
    originalAnswer: string;
    correctedAnswer: string;
    changesSummary: string[];
    citations: GroundedCitation[];
    confidence: number;
}
export interface VerificationPipelineResult {
    sessionId: string;
    userId: string;
    originalAnswer: string;
    status: string;
    summary: VerificationSummary;
    claims: ClaimVerificationResult[];
    correction?: GroundedCorrectionResult;
    processingTimeMs: number;
    completedAt: string;
}
//# sourceMappingURL=verification.types.d.ts.map