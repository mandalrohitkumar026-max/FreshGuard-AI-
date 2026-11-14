import { TimeSensitivity, Verdict } from '../../types/verification.types';
export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
}
export interface GatewayRequestOptions {
    model?: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
    sessionId?: string;
    stage?: string;
    responseFormat?: {
        type: 'json_object';
    };
}
export interface GatewayResponse {
    content: string;
    model: string;
    provider: string;
    usage: TokenUsage;
    latencyMs: number;
    status: 'SUCCESS' | 'ERROR' | 'FALLBACK';
    cached?: boolean;
}
export interface ExtractedClaimItem {
    claimText: string;
    category: string;
    timeSensitive: boolean;
    reason: string;
    order?: number;
}
export interface ClaimExtractionResult {
    claims: ExtractedClaimItem[];
}
export interface TimeSensitivityItem {
    claimText: string;
    timeSensitivity: TimeSensitivity;
    reason: string;
    changeLikelihood: 'LOW' | 'MEDIUM' | 'HIGH';
}
export interface TimeSensitivityResult {
    classifications: TimeSensitivityItem[];
}
export interface EvidenceComparisonResult {
    claimText: string;
    verdict: Verdict;
    confidence: number;
    supportingStatements: string[];
    contradictions: string[];
    explanation: string;
}
export interface CorrectionResult {
    hasModifications: boolean;
    originalAnswer: string;
    correctedAnswer: string;
    changeExplanation: string;
    confidence: number;
}
//# sourceMappingURL=ai.types.d.ts.map