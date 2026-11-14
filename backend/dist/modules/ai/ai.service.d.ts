import { ClaimExtractionResult, TimeSensitivityResult, EvidenceComparisonResult, CorrectionResult } from './ai.types';
export declare class AIService {
    /**
     * Helper to clean JSON string from LLM responses (stripping markdown fences)
     */
    private cleanJson;
    /**
     * FUNCTION 1: CLAIM EXTRACTION
     * Extracts discrete verifiable factual claims from an AI-generated answer.
     */
    extractClaims(answerText: string, topicHint?: string, model?: string): Promise<{
        result: ClaimExtractionResult;
        meta: {
            latencyMs: number;
            usage: any;
            model: string;
        };
    }>;
    /**
     * FUNCTION 2: TIME-SENSITIVITY ANALYSIS
     * Analyzes the time sensitivity and volatility of extracted claims.
     */
    analyzeTimeSensitivity(claims: string[], model?: string): Promise<{
        result: TimeSensitivityResult;
        meta: {
            latencyMs: number;
            usage: any;
            model: string;
        };
    }>;
    /**
     * FUNCTION 3: EVIDENCE ANALYSIS
     * Compares a claim against retrieved web evidence to determine verdict and confidence.
     */
    analyzeEvidence(claimText: string, evidenceItems: Array<{
        title?: string;
        url?: string;
        content: string;
        publishedDate?: string;
    }>, model?: string): Promise<{
        result: EvidenceComparisonResult;
        meta: {
            latencyMs: number;
            usage: any;
            model: string;
        };
    }>;
    /**
     * FUNCTION 4: CORRECTED ANSWER GENERATION
     * Rewrites an answer to fix outdated or contradictory claims while preserving supported content.
     */
    generateCorrection(originalAnswer: string, claims: Array<{
        claimText: string;
        verdict: string;
        explanation?: string;
        evidence?: any[];
    }>, model?: string): Promise<{
        result: CorrectionResult;
        meta: {
            latencyMs: number;
            usage: any;
            model: string;
        };
    }>;
}
export declare const aiService: AIService;
//# sourceMappingURL=ai.service.d.ts.map