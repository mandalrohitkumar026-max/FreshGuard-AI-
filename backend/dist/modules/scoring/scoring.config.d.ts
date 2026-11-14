export interface ScoringThresholds {
    veryFresh: number;
    fresh: number;
    needsReview: number;
    potentiallyOutdated: number;
    severelyOutdated: number;
}
export interface ScoringWeights {
    temporalRelevance: number;
    evidenceRecency: number;
    evidenceQuality: number;
    verificationOutcome: number;
    uncertainty: number;
}
export interface VolatilityDecayPolicy {
    staticHalfLifeDays: number;
    semiDynamicHalfLifeDays: number;
    highlyDynamicHalfLifeDays: number;
}
export interface ScoringEngineConfig {
    version: string;
    thresholds: ScoringThresholds;
    weights: ScoringWeights;
    decayPolicy: VolatilityDecayPolicy;
}
export declare const DEFAULT_SCORING_CONFIG: ScoringEngineConfig;
//# sourceMappingURL=scoring.config.d.ts.map