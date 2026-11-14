import { ClaimTemporalAnalysis, FreshnessAnalysisResponse, FreshnessAnalysisOptions } from './freshness.types';
import { ExtractedClaim } from '../claims/claim.types';
export declare class FreshnessDetectionService {
    /**
     * Main Pipeline Entry Point: Analyzes extracted claims for time sensitivity, volatility, and verification requirements.
     */
    analyzeFreshness(claimsInput: ExtractedClaim[] | string, options?: FreshnessAnalysisOptions): Promise<FreshnessAnalysisResponse>;
    /**
     * VERIFICATION DECISION ENGINE
     * Evaluates an individual claim through deterministic temporal rules and domain heuristics.
     */
    determineVerificationRequirement(claim: ExtractedClaim): ClaimTemporalAnalysis;
    /**
     * Helper to check if a claim is a known permanent stable fact
     */
    private isKnownStableFact;
    /**
     * Safely parses and normalizes Bifrost model output
     */
    private parseModelTemporalResponse;
    /**
     * Persists temporal analysis to MongoDB Claim documents and In-Memory Session Store
     */
    persistTemporalAnalysis(analysisList: ClaimTemporalAnalysis[], verificationId: string): Promise<void>;
    /**
     * Retrieve freshness analysis for a verification session
     */
    getFreshnessByVerificationId(verificationId: string): Promise<ClaimTemporalAnalysis[]>;
}
export declare const freshnessDetectionService: FreshnessDetectionService;
//# sourceMappingURL=freshnessDetectionService.d.ts.map