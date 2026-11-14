import { ScoredClaim, RiskLevel } from '../types/verification.types';
interface AssembleReportInput {
    sessionId: string;
    userId: string;
    originalAnswer: string;
    correctedAnswer?: string;
    correctionExplanation?: string;
    scoredClaims: ScoredClaim[];
    aggregateFreshnessScore: number;
    riskLevel: RiskLevel;
    stats: {
        totalClaims: number;
        staleClaims: number;
        staticClaims: number;
        semiDynamicClaims: number;
        highlyDynamicClaims: number;
        unverifiableClaims: number;
    };
    processingTimeMs: number;
}
/**
 * Report Service (Pipeline Stage 12)
 *
 * Assembles the final verification report document.
 * Supports both MongoDB and inMemoryStore fallback.
 */
export declare function assembleReport(input: AssembleReportInput): Promise<any>;
export {};
//# sourceMappingURL=reportService.d.ts.map