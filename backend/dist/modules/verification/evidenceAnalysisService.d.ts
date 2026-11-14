import { ClaimVerificationResult } from './verification.types';
export declare class EvidenceAnalysisService {
    /**
     * Evaluates an individual extracted factual claim against live web evidence.
     */
    verifyClaim(claim: {
        claimId?: string;
        order?: number;
        claimText: string;
        timeSensitivity?: 'STATIC' | 'SEMI_DYNAMIC' | 'HIGHLY_DYNAMIC';
        category?: string;
    }, temporalAnalysis?: {
        isTimeSensitive?: boolean;
        decision?: 'VERIFY_IMMEDIATELY' | 'VERIFY_LIVE' | 'VERIFY_IF_NEEDED' | 'NOT_REQUIRED';
        freshnessPriority?: string;
        recommendedSearchStrategy?: string;
        reason?: string;
    }, sessionId?: string): Promise<ClaimVerificationResult>;
}
export declare const evidenceAnalysisService: EvidenceAnalysisService;
//# sourceMappingURL=evidenceAnalysisService.d.ts.map