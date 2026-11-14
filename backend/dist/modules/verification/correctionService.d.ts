import { ClaimVerificationResult, GroundedCorrectionResult } from './verification.types';
export declare class CorrectionService {
    /**
     * Generates a grounded corrected version of the original AI answer,
     * replacing outdated facts with verified evidence while retaining all valid context.
     */
    generateGroundedCorrection(originalAnswer: string, verifiedClaims: ClaimVerificationResult[], sessionId?: string): Promise<GroundedCorrectionResult>;
}
export declare const correctionService: CorrectionService;
//# sourceMappingURL=correctionService.d.ts.map