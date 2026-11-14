import { VerifiedEvidenceItem } from './verification.types';
export type ConflictType = 'DIRECT_CONTRADICTION' | 'NUMERICAL_DISAGREEMENT' | 'TEMPORAL_DIFFERENCE' | 'TEMPORAL_SUPERSEDENCE' | 'CONTEXTUAL_DIFFERENCE' | 'METHODOLOGY_DISCREPANCY' | 'INSUFFICIENT_EVIDENCE' | 'NONE';
export type ConflictSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
export interface SourceDisagreement {
    sourceA: {
        url: string;
        domain: string;
        title: string;
        assertion?: string;
        publishedDate?: string | null;
        authorityTier?: string;
        authorityScore?: number;
    };
    sourceB: {
        url: string;
        domain: string;
        title: string;
        assertion?: string;
        publishedDate?: string | null;
        authorityTier?: string;
        authorityScore?: number;
    };
    natureOfDisagreement: string;
    conflictType: ConflictType;
    isContextual: boolean;
    contextualFactor?: string;
}
export interface EvidenceConflictAnalysis {
    hasConflict: boolean;
    conflictType: ConflictType;
    severity: ConflictSeverity;
    explanation: string;
    sourceDisagreements: SourceDisagreement[];
    majorityAssertion?: string;
    authoritativeAssertion?: string;
    authoritativeSourceUrl?: string;
    recommendedResolution: string;
    distinctionNotes: string;
}
export declare class ConflictDetectionService {
    /**
     * Analyzes supporting and contradicting evidence for a claim to detect,
     * categorize, and explain source-by-source conflicts without assuming
     * that majority vote equals truth.
     */
    analyzeConflicts(claimText: string, supportingEvidence: VerifiedEvidenceItem[], contradictingEvidence: VerifiedEvidenceItem[], claimStatus: string): EvidenceConflictAnalysis;
    /**
     * Persists detected evidence conflict analysis to MongoDB.
     */
    persistConflict(sessionId: string, claimId: string, claimText: string, analysis: EvidenceConflictAnalysis): Promise<void>;
}
export declare const conflictDetectionService: ConflictDetectionService;
//# sourceMappingURL=conflictDetectionService.d.ts.map