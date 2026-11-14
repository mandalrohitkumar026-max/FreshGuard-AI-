import { z } from 'zod';
export declare const freshnessPrioritySchema: z.ZodEnum<["HIGH", "MEDIUM", "LOW", "STABLE"]>;
export declare const volatilityLevelSchema: z.ZodEnum<["VERY_HIGH", "HIGH", "MODERATE", "LOW", "STABLE"]>;
export declare const verificationDecisionSchema: z.ZodEnum<["VERIFY_IMMEDIATELY", "VERIFY_LIVE", "VERIFY_IF_NEEDED", "NOT_REQUIRED"]>;
export declare const recommendedSearchStrategySchema: z.ZodEnum<["OFFICIAL_RELEASE_SEARCH", "LEADERSHIP_EXECUTIVE_SEARCH", "REALTIME_FINANCIAL_LOOKUP", "GOVERNMENT_REGULATION_SEARCH", "ACADEMIC_DEADLINE_SEARCH", "GENERAL_WEB_SEARCH", "SKIP_VERIFICATION"]>;
export declare const detectionMethodSchema: z.ZodEnum<["BIFROST_SEMANTIC", "DETERMINISTIC_RULES", "HYBRID"]>;
export declare const claimTemporalAnalysisSchema: z.ZodObject<{
    claimId: z.ZodString;
    claimText: z.ZodString;
    isTimeSensitive: z.ZodBoolean;
    priority: z.ZodEnum<["HIGH", "MEDIUM", "LOW", "STABLE"]>;
    volatility: z.ZodEnum<["VERY_HIGH", "HIGH", "MODERATE", "LOW", "STABLE"]>;
    decision: z.ZodEnum<["VERIFY_IMMEDIATELY", "VERIFY_LIVE", "VERIFY_IF_NEEDED", "NOT_REQUIRED"]>;
    requiresVerification: z.ZodBoolean;
    category: z.ZodDefault<z.ZodString>;
    reason: z.ZodString;
    recommendedSearchStrategy: z.ZodEnum<["OFFICIAL_RELEASE_SEARCH", "LEADERSHIP_EXECUTIVE_SEARCH", "REALTIME_FINANCIAL_LOOKUP", "GOVERNMENT_REGULATION_SEARCH", "ACADEMIC_DEADLINE_SEARCH", "GENERAL_WEB_SEARCH", "SKIP_VERIFICATION"]>;
    preferredSourceType: z.ZodDefault<z.ZodString>;
    detectionMethod: z.ZodDefault<z.ZodEnum<["BIFROST_SEMANTIC", "DETERMINISTIC_RULES", "HYBRID"]>>;
    confidence: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    claimText: string;
    claimId: string;
    category: string;
    volatility: "HIGH" | "LOW" | "STABLE" | "VERY_HIGH" | "MODERATE";
    requiresVerification: boolean;
    recommendedSearchStrategy: "SKIP_VERIFICATION" | "REALTIME_FINANCIAL_LOOKUP" | "LEADERSHIP_EXECUTIVE_SEARCH" | "OFFICIAL_RELEASE_SEARCH" | "ACADEMIC_DEADLINE_SEARCH" | "GENERAL_WEB_SEARCH" | "GOVERNMENT_REGULATION_SEARCH";
    detectionMethod: "HYBRID" | "BIFROST_SEMANTIC" | "DETERMINISTIC_RULES";
    priority: "HIGH" | "MEDIUM" | "LOW" | "STABLE";
    confidence: number;
    isTimeSensitive: boolean;
    decision: "VERIFY_IMMEDIATELY" | "VERIFY_LIVE" | "VERIFY_IF_NEEDED" | "NOT_REQUIRED";
    reason: string;
    preferredSourceType: string;
}, {
    claimText: string;
    claimId: string;
    volatility: "HIGH" | "LOW" | "STABLE" | "VERY_HIGH" | "MODERATE";
    requiresVerification: boolean;
    recommendedSearchStrategy: "SKIP_VERIFICATION" | "REALTIME_FINANCIAL_LOOKUP" | "LEADERSHIP_EXECUTIVE_SEARCH" | "OFFICIAL_RELEASE_SEARCH" | "ACADEMIC_DEADLINE_SEARCH" | "GENERAL_WEB_SEARCH" | "GOVERNMENT_REGULATION_SEARCH";
    priority: "HIGH" | "MEDIUM" | "LOW" | "STABLE";
    isTimeSensitive: boolean;
    decision: "VERIFY_IMMEDIATELY" | "VERIFY_LIVE" | "VERIFY_IF_NEEDED" | "NOT_REQUIRED";
    reason: string;
    category?: string | undefined;
    detectionMethod?: "HYBRID" | "BIFROST_SEMANTIC" | "DETERMINISTIC_RULES" | undefined;
    confidence?: number | undefined;
    preferredSourceType?: string | undefined;
}>;
export declare const freshnessAnalysisResponseSchema: z.ZodObject<{
    verificationId: z.ZodString;
    totalClaims: z.ZodNumber;
    timeSensitiveCount: z.ZodNumber;
    stableCount: z.ZodNumber;
    analysis: z.ZodArray<z.ZodObject<{
        claimId: z.ZodString;
        claimText: z.ZodString;
        isTimeSensitive: z.ZodBoolean;
        priority: z.ZodEnum<["HIGH", "MEDIUM", "LOW", "STABLE"]>;
        volatility: z.ZodEnum<["VERY_HIGH", "HIGH", "MODERATE", "LOW", "STABLE"]>;
        decision: z.ZodEnum<["VERIFY_IMMEDIATELY", "VERIFY_LIVE", "VERIFY_IF_NEEDED", "NOT_REQUIRED"]>;
        requiresVerification: z.ZodBoolean;
        category: z.ZodDefault<z.ZodString>;
        reason: z.ZodString;
        recommendedSearchStrategy: z.ZodEnum<["OFFICIAL_RELEASE_SEARCH", "LEADERSHIP_EXECUTIVE_SEARCH", "REALTIME_FINANCIAL_LOOKUP", "GOVERNMENT_REGULATION_SEARCH", "ACADEMIC_DEADLINE_SEARCH", "GENERAL_WEB_SEARCH", "SKIP_VERIFICATION"]>;
        preferredSourceType: z.ZodDefault<z.ZodString>;
        detectionMethod: z.ZodDefault<z.ZodEnum<["BIFROST_SEMANTIC", "DETERMINISTIC_RULES", "HYBRID"]>>;
        confidence: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        claimText: string;
        claimId: string;
        category: string;
        volatility: "HIGH" | "LOW" | "STABLE" | "VERY_HIGH" | "MODERATE";
        requiresVerification: boolean;
        recommendedSearchStrategy: "SKIP_VERIFICATION" | "REALTIME_FINANCIAL_LOOKUP" | "LEADERSHIP_EXECUTIVE_SEARCH" | "OFFICIAL_RELEASE_SEARCH" | "ACADEMIC_DEADLINE_SEARCH" | "GENERAL_WEB_SEARCH" | "GOVERNMENT_REGULATION_SEARCH";
        detectionMethod: "HYBRID" | "BIFROST_SEMANTIC" | "DETERMINISTIC_RULES";
        priority: "HIGH" | "MEDIUM" | "LOW" | "STABLE";
        confidence: number;
        isTimeSensitive: boolean;
        decision: "VERIFY_IMMEDIATELY" | "VERIFY_LIVE" | "VERIFY_IF_NEEDED" | "NOT_REQUIRED";
        reason: string;
        preferredSourceType: string;
    }, {
        claimText: string;
        claimId: string;
        volatility: "HIGH" | "LOW" | "STABLE" | "VERY_HIGH" | "MODERATE";
        requiresVerification: boolean;
        recommendedSearchStrategy: "SKIP_VERIFICATION" | "REALTIME_FINANCIAL_LOOKUP" | "LEADERSHIP_EXECUTIVE_SEARCH" | "OFFICIAL_RELEASE_SEARCH" | "ACADEMIC_DEADLINE_SEARCH" | "GENERAL_WEB_SEARCH" | "GOVERNMENT_REGULATION_SEARCH";
        priority: "HIGH" | "MEDIUM" | "LOW" | "STABLE";
        isTimeSensitive: boolean;
        decision: "VERIFY_IMMEDIATELY" | "VERIFY_LIVE" | "VERIFY_IF_NEEDED" | "NOT_REQUIRED";
        reason: string;
        category?: string | undefined;
        detectionMethod?: "HYBRID" | "BIFROST_SEMANTIC" | "DETERMINISTIC_RULES" | undefined;
        confidence?: number | undefined;
        preferredSourceType?: string | undefined;
    }>, "many">;
    model: z.ZodString;
    latencyMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    verificationId: string;
    model: string;
    totalClaims: number;
    latencyMs: number;
    timeSensitiveCount: number;
    stableCount: number;
    analysis: {
        claimText: string;
        claimId: string;
        category: string;
        volatility: "HIGH" | "LOW" | "STABLE" | "VERY_HIGH" | "MODERATE";
        requiresVerification: boolean;
        recommendedSearchStrategy: "SKIP_VERIFICATION" | "REALTIME_FINANCIAL_LOOKUP" | "LEADERSHIP_EXECUTIVE_SEARCH" | "OFFICIAL_RELEASE_SEARCH" | "ACADEMIC_DEADLINE_SEARCH" | "GENERAL_WEB_SEARCH" | "GOVERNMENT_REGULATION_SEARCH";
        detectionMethod: "HYBRID" | "BIFROST_SEMANTIC" | "DETERMINISTIC_RULES";
        priority: "HIGH" | "MEDIUM" | "LOW" | "STABLE";
        confidence: number;
        isTimeSensitive: boolean;
        decision: "VERIFY_IMMEDIATELY" | "VERIFY_LIVE" | "VERIFY_IF_NEEDED" | "NOT_REQUIRED";
        reason: string;
        preferredSourceType: string;
    }[];
}, {
    verificationId: string;
    model: string;
    totalClaims: number;
    latencyMs: number;
    timeSensitiveCount: number;
    stableCount: number;
    analysis: {
        claimText: string;
        claimId: string;
        volatility: "HIGH" | "LOW" | "STABLE" | "VERY_HIGH" | "MODERATE";
        requiresVerification: boolean;
        recommendedSearchStrategy: "SKIP_VERIFICATION" | "REALTIME_FINANCIAL_LOOKUP" | "LEADERSHIP_EXECUTIVE_SEARCH" | "OFFICIAL_RELEASE_SEARCH" | "ACADEMIC_DEADLINE_SEARCH" | "GENERAL_WEB_SEARCH" | "GOVERNMENT_REGULATION_SEARCH";
        priority: "HIGH" | "MEDIUM" | "LOW" | "STABLE";
        isTimeSensitive: boolean;
        decision: "VERIFY_IMMEDIATELY" | "VERIFY_LIVE" | "VERIFY_IF_NEEDED" | "NOT_REQUIRED";
        reason: string;
        category?: string | undefined;
        detectionMethod?: "HYBRID" | "BIFROST_SEMANTIC" | "DETERMINISTIC_RULES" | undefined;
        confidence?: number | undefined;
        preferredSourceType?: string | undefined;
    }[];
}>;
export declare const analyzeFreshnessApiRequestSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        verificationId: z.ZodOptional<z.ZodString>;
        claims: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        answerText: z.ZodOptional<z.ZodString>;
        topicHint: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        answerText?: string | undefined;
        claims?: any[] | undefined;
        verificationId?: string | undefined;
        model?: string | undefined;
        topicHint?: string | undefined;
    }, {
        answerText?: string | undefined;
        claims?: any[] | undefined;
        verificationId?: string | undefined;
        model?: string | undefined;
        topicHint?: string | undefined;
    }>, {
        answerText?: string | undefined;
        claims?: any[] | undefined;
        verificationId?: string | undefined;
        model?: string | undefined;
        topicHint?: string | undefined;
    }, {
        answerText?: string | undefined;
        claims?: any[] | undefined;
        verificationId?: string | undefined;
        model?: string | undefined;
        topicHint?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        answerText?: string | undefined;
        claims?: any[] | undefined;
        verificationId?: string | undefined;
        model?: string | undefined;
        topicHint?: string | undefined;
    };
}, {
    body: {
        answerText?: string | undefined;
        claims?: any[] | undefined;
        verificationId?: string | undefined;
        model?: string | undefined;
        topicHint?: string | undefined;
    };
}>;
//# sourceMappingURL=freshness.validation.d.ts.map