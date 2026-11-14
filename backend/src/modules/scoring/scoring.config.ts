export interface ScoringThresholds {
  veryFresh: number; // 90
  fresh: number; // 75
  needsReview: number; // 50
  potentiallyOutdated: number; // 25
  severelyOutdated: number; // 0
}

export interface ScoringWeights {
  temporalRelevance: number; // 0.20
  evidenceRecency: number; // 0.25
  evidenceQuality: number; // 0.25
  verificationOutcome: number; // 0.20
  uncertainty: number; // 0.10
}

export interface VolatilityDecayPolicy {
  staticHalfLifeDays: number; // Infinity
  semiDynamicHalfLifeDays: number; // 365 days
  highlyDynamicHalfLifeDays: number; // 60 days
}

export interface ScoringEngineConfig {
  version: string;
  thresholds: ScoringThresholds;
  weights: ScoringWeights;
  decayPolicy: VolatilityDecayPolicy;
}

export const DEFAULT_SCORING_CONFIG: ScoringEngineConfig = {
  version: '2.0.0',
  thresholds: {
    veryFresh: 90,
    fresh: 75,
    needsReview: 50,
    potentiallyOutdated: 25,
    severelyOutdated: 0,
  },
  weights: {
    temporalRelevance: 0.20,
    evidenceRecency: 0.25,
    evidenceQuality: 0.25,
    verificationOutcome: 0.20,
    uncertainty: 0.10,
  },
  decayPolicy: {
    staticHalfLifeDays: 999999, // Never decays
    semiDynamicHalfLifeDays: 365,
    highlyDynamicHalfLifeDays: 60,
  },
};
