import { GroundedCorrectionResult, VerificationPipelineResult } from './verification.types';
export declare class VerificationService {
    createSession(data: {
        userId: string;
        originalAnswer: string;
        context?: {
            topic?: string;
            sourceModel?: string;
            [key: string]: any;
        };
    }): Promise<any>;
    getSessionById(id: string, requesterUserId?: string, requesterUserRole?: string): Promise<any>;
    listSessions(userId: string, filters?: {
        page?: number;
        limit?: number;
        riskLevel?: string;
    }): Promise<{
        sessions: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    deleteSession(id: string, userId?: string): Promise<boolean>;
    /**
     * PHASE 08 CORE PIPELINE:
     * Runs the complete verification pipeline for a session:
     * 1. Claim Extraction (Phase 06)
     * 2. Freshness & Temporal Analysis (Phase 07)
     * 3. Live Web Retrieval & Evidence Comparison (Phase 05 & 08)
     * 4. Grounded Correction Generation (Phase 08)
     * 5. Metrics Scoring & Persistence
     */
    runVerification(sessionId: string): Promise<VerificationPipelineResult>;
    /**
     * Retrieves full verification results including summary, verified claims, and grounded correction.
     */
    getVerificationResults(sessionId: string): Promise<VerificationPipelineResult>;
    /**
     * Retrieves the grounded correction for a session.
     */
    getCorrection(sessionId: string): Promise<GroundedCorrectionResult>;
    /**
     * Retrieves evidence details and sources for an individual claim.
     */
    getClaimEvidence(claimIdOrOrder: string): Promise<{
        claimId: string;
        supportingEvidence: any[];
        contradictingEvidence: any[];
        sources: any[];
    }>;
}
export declare const verificationService: VerificationService;
//# sourceMappingURL=verification.service.d.ts.map