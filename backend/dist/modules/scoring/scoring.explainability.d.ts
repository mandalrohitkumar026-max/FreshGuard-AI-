import { ScoringFactors, ClaimScoringInput, ClaimRiskLevel } from './scoring.types';
export interface ExplainabilityAnalysis {
    explanation: string;
    recommendedAction: string;
    positiveContributions: string[];
    negativeContributions: string[];
}
export declare class ScoringExplainabilityService {
    generateClaimExplanation(claim: ClaimScoringInput, factors: ScoringFactors, score: number, riskLevel: ClaimRiskLevel): ExplainabilityAnalysis;
}
export declare const scoringExplainabilityService: ScoringExplainabilityService;
//# sourceMappingURL=scoring.explainability.d.ts.map