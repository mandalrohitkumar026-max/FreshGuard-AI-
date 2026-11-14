"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SCORING_CONFIG = void 0;
exports.DEFAULT_SCORING_CONFIG = {
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
//# sourceMappingURL=scoring.config.js.map