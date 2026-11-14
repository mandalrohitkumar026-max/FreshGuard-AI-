import { z } from 'zod';
export declare const claimItemSchema: z.ZodObject<{
    claimText: z.ZodString;
    category: z.ZodDefault<z.ZodString>;
    timeSensitive: z.ZodDefault<z.ZodBoolean>;
    reason: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    claimText: string;
    category: string;
    reason: string;
    timeSensitive: boolean;
}, {
    claimText: string;
    category?: string | undefined;
    reason?: string | undefined;
    timeSensitive?: boolean | undefined;
}>;
export declare const claimExtractionResponseSchema: z.ZodObject<{
    claims: z.ZodArray<z.ZodObject<{
        claimText: z.ZodString;
        category: z.ZodDefault<z.ZodString>;
        timeSensitive: z.ZodDefault<z.ZodBoolean>;
        reason: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        claimText: string;
        category: string;
        reason: string;
        timeSensitive: boolean;
    }, {
        claimText: string;
        category?: string | undefined;
        reason?: string | undefined;
        timeSensitive?: boolean | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    claims: {
        claimText: string;
        category: string;
        reason: string;
        timeSensitive: boolean;
    }[];
}, {
    claims: {
        claimText: string;
        category?: string | undefined;
        reason?: string | undefined;
        timeSensitive?: boolean | undefined;
    }[];
}>;
export declare const timeSensitivityItemSchema: z.ZodObject<{
    claimText: z.ZodString;
    timeSensitivity: z.ZodEnum<["STATIC", "SEMI_DYNAMIC", "HIGHLY_DYNAMIC"]>;
    reason: z.ZodDefault<z.ZodString>;
    changeLikelihood: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>;
}, "strip", z.ZodTypeAny, {
    claimText: string;
    timeSensitivity: "STATIC" | "SEMI_DYNAMIC" | "HIGHLY_DYNAMIC";
    reason: string;
    changeLikelihood: "HIGH" | "MEDIUM" | "LOW";
}, {
    claimText: string;
    timeSensitivity: "STATIC" | "SEMI_DYNAMIC" | "HIGHLY_DYNAMIC";
    reason?: string | undefined;
    changeLikelihood?: "HIGH" | "MEDIUM" | "LOW" | undefined;
}>;
export declare const timeSensitivityResponseSchema: z.ZodObject<{
    classifications: z.ZodArray<z.ZodObject<{
        claimText: z.ZodString;
        timeSensitivity: z.ZodEnum<["STATIC", "SEMI_DYNAMIC", "HIGHLY_DYNAMIC"]>;
        reason: z.ZodDefault<z.ZodString>;
        changeLikelihood: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>;
    }, "strip", z.ZodTypeAny, {
        claimText: string;
        timeSensitivity: "STATIC" | "SEMI_DYNAMIC" | "HIGHLY_DYNAMIC";
        reason: string;
        changeLikelihood: "HIGH" | "MEDIUM" | "LOW";
    }, {
        claimText: string;
        timeSensitivity: "STATIC" | "SEMI_DYNAMIC" | "HIGHLY_DYNAMIC";
        reason?: string | undefined;
        changeLikelihood?: "HIGH" | "MEDIUM" | "LOW" | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    classifications: {
        claimText: string;
        timeSensitivity: "STATIC" | "SEMI_DYNAMIC" | "HIGHLY_DYNAMIC";
        reason: string;
        changeLikelihood: "HIGH" | "MEDIUM" | "LOW";
    }[];
}, {
    classifications: {
        claimText: string;
        timeSensitivity: "STATIC" | "SEMI_DYNAMIC" | "HIGHLY_DYNAMIC";
        reason?: string | undefined;
        changeLikelihood?: "HIGH" | "MEDIUM" | "LOW" | undefined;
    }[];
}>;
export declare const evidenceAnalysisResponseSchema: z.ZodObject<{
    verdict: z.ZodEnum<["CONFIRMS", "CONTRADICTS", "PARTIALLY_CONTRADICTS", "INSUFFICIENT"]>;
    confidence: z.ZodNumber;
    supportingStatements: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    contradictions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    explanation: z.ZodString;
}, "strip", z.ZodTypeAny, {
    verdict: "CONFIRMS" | "CONTRADICTS" | "PARTIALLY_CONTRADICTS" | "INSUFFICIENT";
    confidence: number;
    explanation: string;
    supportingStatements: string[];
    contradictions: string[];
}, {
    verdict: "CONFIRMS" | "CONTRADICTS" | "PARTIALLY_CONTRADICTS" | "INSUFFICIENT";
    confidence: number;
    explanation: string;
    supportingStatements?: string[] | undefined;
    contradictions?: string[] | undefined;
}>;
export declare const correctionResponseSchema: z.ZodObject<{
    hasModifications: z.ZodDefault<z.ZodBoolean>;
    correctedAnswer: z.ZodString;
    changeExplanation: z.ZodDefault<z.ZodString>;
    confidence: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    confidence: number;
    correctedAnswer: string;
    hasModifications: boolean;
    changeExplanation: string;
}, {
    correctedAnswer: string;
    confidence?: number | undefined;
    hasModifications?: boolean | undefined;
    changeExplanation?: string | undefined;
}>;
export declare const extractClaimsRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        answerText: z.ZodString;
        topicHint: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        answerText: string;
        model?: string | undefined;
        topicHint?: string | undefined;
    }, {
        answerText: string;
        model?: string | undefined;
        topicHint?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        answerText: string;
        model?: string | undefined;
        topicHint?: string | undefined;
    };
}, {
    body: {
        answerText: string;
        model?: string | undefined;
        topicHint?: string | undefined;
    };
}>;
export declare const analyzeClaimsRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        claims: z.ZodArray<z.ZodString, "many">;
        model: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        claims: string[];
        model?: string | undefined;
    }, {
        claims: string[];
        model?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        claims: string[];
        model?: string | undefined;
    };
}, {
    body: {
        claims: string[];
        model?: string | undefined;
    };
}>;
export declare const analyzeEvidenceRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        claimText: z.ZodString;
        evidence: z.ZodArray<z.ZodObject<{
            title: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            content: z.ZodString;
            domain: z.ZodOptional<z.ZodString>;
            publishedDate: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            content: string;
            url?: string | undefined;
            title?: string | undefined;
            domain?: string | undefined;
            publishedDate?: string | undefined;
        }, {
            content: string;
            url?: string | undefined;
            title?: string | undefined;
            domain?: string | undefined;
            publishedDate?: string | undefined;
        }>, "many">;
        model: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        claimText: string;
        evidence: {
            content: string;
            url?: string | undefined;
            title?: string | undefined;
            domain?: string | undefined;
            publishedDate?: string | undefined;
        }[];
        model?: string | undefined;
    }, {
        claimText: string;
        evidence: {
            content: string;
            url?: string | undefined;
            title?: string | undefined;
            domain?: string | undefined;
            publishedDate?: string | undefined;
        }[];
        model?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        claimText: string;
        evidence: {
            content: string;
            url?: string | undefined;
            title?: string | undefined;
            domain?: string | undefined;
            publishedDate?: string | undefined;
        }[];
        model?: string | undefined;
    };
}, {
    body: {
        claimText: string;
        evidence: {
            content: string;
            url?: string | undefined;
            title?: string | undefined;
            domain?: string | undefined;
            publishedDate?: string | undefined;
        }[];
        model?: string | undefined;
    };
}>;
export declare const generateCorrectionRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        originalAnswer: z.ZodString;
        claims: z.ZodArray<z.ZodObject<{
            claimText: z.ZodString;
            verdict: z.ZodString;
            explanation: z.ZodOptional<z.ZodString>;
            evidence: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        }, "strip", z.ZodTypeAny, {
            claimText: string;
            verdict: string;
            evidence?: any[] | undefined;
            explanation?: string | undefined;
        }, {
            claimText: string;
            verdict: string;
            evidence?: any[] | undefined;
            explanation?: string | undefined;
        }>, "many">;
        model: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        originalAnswer: string;
        claims: {
            claimText: string;
            verdict: string;
            evidence?: any[] | undefined;
            explanation?: string | undefined;
        }[];
        model?: string | undefined;
    }, {
        originalAnswer: string;
        claims: {
            claimText: string;
            verdict: string;
            evidence?: any[] | undefined;
            explanation?: string | undefined;
        }[];
        model?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        originalAnswer: string;
        claims: {
            claimText: string;
            verdict: string;
            evidence?: any[] | undefined;
            explanation?: string | undefined;
        }[];
        model?: string | undefined;
    };
}, {
    body: {
        originalAnswer: string;
        claims: {
            claimText: string;
            verdict: string;
            evidence?: any[] | undefined;
            explanation?: string | undefined;
        }[];
        model?: string | undefined;
    };
}>;
//# sourceMappingURL=ai.validation.d.ts.map