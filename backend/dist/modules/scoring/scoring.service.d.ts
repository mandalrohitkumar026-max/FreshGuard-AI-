import { ScoringEngineConfig } from './scoring.config';
import { ClaimScoringInput, ClaimScoringOutput, AnswerScoringOutput } from './scoring.types';
export declare class ScoringService {
    private config;
    constructor(config?: ScoringEngineConfig);
    getConfig(): ScoringEngineConfig;
    /**
     * Evaluates a single factual claim across all 5 scoring factors and assigns risk level.
     */
    evaluateClaim(claim: ClaimScoringInput): ClaimScoringOutput;
    /**
     * Evaluates an entire AI answer by aggregating individual claim scores and triaging overall risk.
     */
    evaluateAnswer(claims: ClaimScoringInput[]): AnswerScoringOutput;
}
export declare const scoringService: ScoringService;
//# sourceMappingURL=scoring.service.d.ts.map