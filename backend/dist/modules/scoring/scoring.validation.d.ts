import { z } from 'zod';
export declare const scoringFactorsSchema: z.ZodObject<{
    temporalRelevance: z.ZodNumber;
    evidenceRecency: z.ZodNumber;
    evidenceQuality: z.ZodNumber;
    verificationOutcome: z.ZodNumber;
    uncertainty: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    temporalRelevance: number;
    evidenceRecency: number;
    evidenceQuality: number;
    verificationOutcome: number;
    uncertainty: number;
}, {
    temporalRelevance: number;
    evidenceRecency: number;
    evidenceQuality: number;
    verificationOutcome: number;
    uncertainty: number;
}>;
export declare const claimScoringOutputSchema: z.ZodObject<{
    claimId: z.ZodString;
    order: z.ZodNumber;
    claimText: z.ZodString;
    freshnessScore: z.ZodNumber;
    riskLevel: z.ZodEnum<["LOW", "MODERATE", "HIGH", "CRITICAL"]>;
    timeSensitivity: z.ZodString;
    verificationStatus: z.ZodEnum<["SUPPORTED", "OUTDATED", "PARTIALLY_SUPPORTED", "CONFLICTING", "UNVERIFIED", "NOT_CHECKED"]>;
    evidenceConfidence: z.ZodNumber;
    explanation: z.ZodString;
    factors: z.ZodObject<{
        temporalRelevance: z.ZodNumber;
        evidenceRecency: z.ZodNumber;
        evidenceQuality: z.ZodNumber;
        verificationOutcome: z.ZodNumber;
        uncertainty: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        temporalRelevance: number;
        evidenceRecency: number;
        evidenceQuality: number;
        verificationOutcome: number;
        uncertainty: number;
    }, {
        temporalRelevance: number;
        evidenceRecency: number;
        evidenceQuality: number;
        verificationOutcome: number;
        uncertainty: number;
    }>;
    recommendedAction: z.ZodString;
    positiveContributions: z.ZodArray<z.ZodString, "many">;
    negativeContributions: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    claimText: string;
    claimId: string;
    riskLevel: "HIGH" | "LOW" | "MODERATE" | "CRITICAL";
    order: number;
    timeSensitivity: string;
    verificationStatus: "OUTDATED" | "UNVERIFIED" | "CONFLICTING" | "PARTIALLY_SUPPORTED" | "SUPPORTED" | "NOT_CHECKED";
    explanation: string;
    freshnessScore: number;
    factors: {
        temporalRelevance: number;
        evidenceRecency: number;
        evidenceQuality: number;
        verificationOutcome: number;
        uncertainty: number;
    };
    recommendedAction: string;
    positiveContributions: string[];
    negativeContributions: string[];
    evidenceConfidence: number;
}, {
    claimText: string;
    claimId: string;
    riskLevel: "HIGH" | "LOW" | "MODERATE" | "CRITICAL";
    order: number;
    timeSensitivity: string;
    verificationStatus: "OUTDATED" | "UNVERIFIED" | "CONFLICTING" | "PARTIALLY_SUPPORTED" | "SUPPORTED" | "NOT_CHECKED";
    explanation: string;
    freshnessScore: number;
    factors: {
        temporalRelevance: number;
        evidenceRecency: number;
        evidenceQuality: number;
        verificationOutcome: number;
        uncertainty: number;
    };
    recommendedAction: string;
    positiveContributions: string[];
    negativeContributions: string[];
    evidenceConfidence: number;
}>;
export declare const answerScoringOutputSchema: z.ZodObject<{
    overallFreshnessScore: z.ZodNumber;
    overallRiskLevel: z.ZodEnum<["LOW", "MODERATE", "HIGH", "CRITICAL"]>;
    freshnessInterpretation: z.ZodEnum<["VERY_FRESH", "FRESH", "NEEDS_REVIEW", "POTENTIALLY_OUTDATED", "SEVERELY_OUTDATED"]>;
    riskExplanation: z.ZodString;
    explanation: z.ZodString;
    totalClaims: z.ZodNumber;
    supportedClaims: z.ZodNumber;
    outdatedClaims: z.ZodNumber;
    partiallySupportedClaims: z.ZodNumber;
    conflictingClaims: z.ZodNumber;
    unverifiedClaims: z.ZodNumber;
    claimsNotChecked: z.ZodNumber;
    claims: z.ZodArray<z.ZodObject<{
        claimId: z.ZodString;
        order: z.ZodNumber;
        claimText: z.ZodString;
        freshnessScore: z.ZodNumber;
        riskLevel: z.ZodEnum<["LOW", "MODERATE", "HIGH", "CRITICAL"]>;
        timeSensitivity: z.ZodString;
        verificationStatus: z.ZodEnum<["SUPPORTED", "OUTDATED", "PARTIALLY_SUPPORTED", "CONFLICTING", "UNVERIFIED", "NOT_CHECKED"]>;
        evidenceConfidence: z.ZodNumber;
        explanation: z.ZodString;
        factors: z.ZodObject<{
            temporalRelevance: z.ZodNumber;
            evidenceRecency: z.ZodNumber;
            evidenceQuality: z.ZodNumber;
            verificationOutcome: z.ZodNumber;
            uncertainty: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            temporalRelevance: number;
            evidenceRecency: number;
            evidenceQuality: number;
            verificationOutcome: number;
            uncertainty: number;
        }, {
            temporalRelevance: number;
            evidenceRecency: number;
            evidenceQuality: number;
            verificationOutcome: number;
            uncertainty: number;
        }>;
        recommendedAction: z.ZodString;
        positiveContributions: z.ZodArray<z.ZodString, "many">;
        negativeContributions: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        claimText: string;
        claimId: string;
        riskLevel: "HIGH" | "LOW" | "MODERATE" | "CRITICAL";
        order: number;
        timeSensitivity: string;
        verificationStatus: "OUTDATED" | "UNVERIFIED" | "CONFLICTING" | "PARTIALLY_SUPPORTED" | "SUPPORTED" | "NOT_CHECKED";
        explanation: string;
        freshnessScore: number;
        factors: {
            temporalRelevance: number;
            evidenceRecency: number;
            evidenceQuality: number;
            verificationOutcome: number;
            uncertainty: number;
        };
        recommendedAction: string;
        positiveContributions: string[];
        negativeContributions: string[];
        evidenceConfidence: number;
    }, {
        claimText: string;
        claimId: string;
        riskLevel: "HIGH" | "LOW" | "MODERATE" | "CRITICAL";
        order: number;
        timeSensitivity: string;
        verificationStatus: "OUTDATED" | "UNVERIFIED" | "CONFLICTING" | "PARTIALLY_SUPPORTED" | "SUPPORTED" | "NOT_CHECKED";
        explanation: string;
        freshnessScore: number;
        factors: {
            temporalRelevance: number;
            evidenceRecency: number;
            evidenceQuality: number;
            verificationOutcome: number;
            uncertainty: number;
        };
        recommendedAction: string;
        positiveContributions: string[];
        negativeContributions: string[];
        evidenceConfidence: number;
    }>, "many">;
    scoringConfigVersion: z.ZodString;
    evaluatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    claims: {
        claimText: string;
        claimId: string;
        riskLevel: "HIGH" | "LOW" | "MODERATE" | "CRITICAL";
        order: number;
        timeSensitivity: string;
        verificationStatus: "OUTDATED" | "UNVERIFIED" | "CONFLICTING" | "PARTIALLY_SUPPORTED" | "SUPPORTED" | "NOT_CHECKED";
        explanation: string;
        freshnessScore: number;
        factors: {
            temporalRelevance: number;
            evidenceRecency: number;
            evidenceQuality: number;
            verificationOutcome: number;
            uncertainty: number;
        };
        recommendedAction: string;
        positiveContributions: string[];
        negativeContributions: string[];
        evidenceConfidence: number;
    }[];
    totalClaims: number;
    explanation: string;
    overallFreshnessScore: number;
    overallRiskLevel: "HIGH" | "LOW" | "MODERATE" | "CRITICAL";
    freshnessInterpretation: "FRESH" | "VERY_FRESH" | "NEEDS_REVIEW" | "POTENTIALLY_OUTDATED" | "SEVERELY_OUTDATED";
    riskExplanation: string;
    supportedClaims: number;
    outdatedClaims: number;
    partiallySupportedClaims: number;
    conflictingClaims: number;
    unverifiedClaims: number;
    claimsNotChecked: number;
    scoringConfigVersion: string;
    evaluatedAt: string;
}, {
    claims: {
        claimText: string;
        claimId: string;
        riskLevel: "HIGH" | "LOW" | "MODERATE" | "CRITICAL";
        order: number;
        timeSensitivity: string;
        verificationStatus: "OUTDATED" | "UNVERIFIED" | "CONFLICTING" | "PARTIALLY_SUPPORTED" | "SUPPORTED" | "NOT_CHECKED";
        explanation: string;
        freshnessScore: number;
        factors: {
            temporalRelevance: number;
            evidenceRecency: number;
            evidenceQuality: number;
            verificationOutcome: number;
            uncertainty: number;
        };
        recommendedAction: string;
        positiveContributions: string[];
        negativeContributions: string[];
        evidenceConfidence: number;
    }[];
    totalClaims: number;
    explanation: string;
    overallFreshnessScore: number;
    overallRiskLevel: "HIGH" | "LOW" | "MODERATE" | "CRITICAL";
    freshnessInterpretation: "FRESH" | "VERY_FRESH" | "NEEDS_REVIEW" | "POTENTIALLY_OUTDATED" | "SEVERELY_OUTDATED";
    riskExplanation: string;
    supportedClaims: number;
    outdatedClaims: number;
    partiallySupportedClaims: number;
    conflictingClaims: number;
    unverifiedClaims: number;
    claimsNotChecked: number;
    scoringConfigVersion: string;
    evaluatedAt: string;
}>;
//# sourceMappingURL=scoring.validation.d.ts.map