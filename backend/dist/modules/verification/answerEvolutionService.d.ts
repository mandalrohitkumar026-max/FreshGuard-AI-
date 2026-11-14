import { ClaimVerificationResult } from './verification.types';
export type ClaimChangeClassification = 'ADDED' | 'REMOVED' | 'UNCHANGED' | 'MODIFIED' | 'NEWLY_OUTDATED' | 'NEWLY_SUPPORTED' | 'NEWLY_CONFLICTING' | 'NEWLY_UNVERIFIED';
export interface ChangedClaim {
    claimText: string;
    previousStatus: string;
    currentStatus: string;
    previousVerdict: string;
    currentVerdict: string;
    classification: ClaimChangeClassification;
    resolutionType: 'STALENESS_RESOLVED' | 'NEWLY_OUTDATED' | 'REFINED' | 'UNCHANGED';
    explanation: string;
}
export interface EvolutionTimelineEvent {
    version: number;
    sessionId: string;
    timestamp: string;
    overallFreshnessScore: number;
    totalClaims: number;
    staleClaims: number;
    riskLevel: string;
}
export interface AnswerEvolutionResult {
    parentSessionId?: string;
    currentSessionId: string;
    version: number;
    scoreDelta: number;
    previousScore: number;
    currentScore: number;
    addedClaims: ClaimVerificationResult[];
    removedClaims: ClaimVerificationResult[];
    changedClaims: ChangedClaim[];
    unmodifiedClaims: ClaimVerificationResult[];
    stalenessResolvedCount: number;
    newlyOutdatedCount: number;
    summary: string;
    timeline: EvolutionTimelineEvent[];
}
export declare class AnswerEvolutionService {
    /**
     * Compares two verification reports and tracks claim-by-claim evolution.
     */
    compareVersions(parentSessionId: string, currentSessionId: string): Promise<AnswerEvolutionResult>;
    /**
     * Submits a revised version of an answer, verifies it, links it to parentSessionId,
     * and returns both the verification report and evolution delta.
     */
    submitRevision(data: {
        parentSessionId: string;
        revisedAnswer: string;
        userId: string;
        context?: any;
    }): Promise<{
        verification: any;
        evolution: AnswerEvolutionResult;
    }>;
}
export declare const answerEvolutionService: AnswerEvolutionService;
//# sourceMappingURL=answerEvolutionService.d.ts.map