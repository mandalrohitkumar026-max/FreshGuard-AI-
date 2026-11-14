import { z } from 'zod';
export declare const searchQueryRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        query: z.ZodString;
        searchDepth: z.ZodOptional<z.ZodDefault<z.ZodEnum<["basic", "advanced"]>>>;
        topic: z.ZodOptional<z.ZodDefault<z.ZodEnum<["general", "news", "finance"]>>>;
        maxResults: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        includeAnswer: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        topic?: "general" | "news" | "finance" | undefined;
        maxResults?: number | undefined;
        searchDepth?: "basic" | "advanced" | undefined;
        includeAnswer?: boolean | undefined;
    }, {
        query: string;
        topic?: "general" | "news" | "finance" | undefined;
        maxResults?: number | undefined;
        searchDepth?: "basic" | "advanced" | undefined;
        includeAnswer?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        query: string;
        topic?: "general" | "news" | "finance" | undefined;
        maxResults?: number | undefined;
        searchDepth?: "basic" | "advanced" | undefined;
        includeAnswer?: boolean | undefined;
    };
}, {
    body: {
        query: string;
        topic?: "general" | "news" | "finance" | undefined;
        maxResults?: number | undefined;
        searchDepth?: "basic" | "advanced" | undefined;
        includeAnswer?: boolean | undefined;
    };
}>;
export declare const claimEvidenceRequestSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        claim: z.ZodOptional<z.ZodString>;
        claimText: z.ZodOptional<z.ZodString>;
        topicHint: z.ZodOptional<z.ZodString>;
        searchDepth: z.ZodOptional<z.ZodDefault<z.ZodEnum<["basic", "advanced"]>>>;
        maxResults: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        sessionId: z.ZodOptional<z.ZodString>;
        claimId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        claimText?: string | undefined;
        claimId?: string | undefined;
        sessionId?: string | undefined;
        topicHint?: string | undefined;
        maxResults?: number | undefined;
        searchDepth?: "basic" | "advanced" | undefined;
        claim?: string | undefined;
    }, {
        claimText?: string | undefined;
        claimId?: string | undefined;
        sessionId?: string | undefined;
        topicHint?: string | undefined;
        maxResults?: number | undefined;
        searchDepth?: "basic" | "advanced" | undefined;
        claim?: string | undefined;
    }>, {
        claimText?: string | undefined;
        claimId?: string | undefined;
        sessionId?: string | undefined;
        topicHint?: string | undefined;
        maxResults?: number | undefined;
        searchDepth?: "basic" | "advanced" | undefined;
        claim?: string | undefined;
    }, {
        claimText?: string | undefined;
        claimId?: string | undefined;
        sessionId?: string | undefined;
        topicHint?: string | undefined;
        maxResults?: number | undefined;
        searchDepth?: "basic" | "advanced" | undefined;
        claim?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        claimText?: string | undefined;
        claimId?: string | undefined;
        sessionId?: string | undefined;
        topicHint?: string | undefined;
        maxResults?: number | undefined;
        searchDepth?: "basic" | "advanced" | undefined;
        claim?: string | undefined;
    };
}, {
    body: {
        claimText?: string | undefined;
        claimId?: string | undefined;
        sessionId?: string | undefined;
        topicHint?: string | undefined;
        maxResults?: number | undefined;
        searchDepth?: "basic" | "advanced" | undefined;
        claim?: string | undefined;
    };
}>;
export declare const normalizedEvidenceSchema: z.ZodObject<{
    sourceTitle: z.ZodString;
    sourceUrl: z.ZodString;
    sourceDomain: z.ZodString;
    content: z.ZodString;
    publishedAt: z.ZodNullable<z.ZodString>;
    retrievedAt: z.ZodString;
    relevanceScore: z.ZodNumber;
    authorityScore: z.ZodNumber;
    authorityTier: z.ZodEnum<["HIGH", "MEDIUM", "LOW", "UNKNOWN"]>;
    sourceType: z.ZodEnum<["official_documentation", "government", "academic", "company_official", "established_news", "community", "general"]>;
    usedInAnalysis: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    content: string;
    authorityScore: number;
    authorityTier: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
    usedInAnalysis: boolean;
    sourceTitle: string;
    sourceUrl: string;
    sourceDomain: string;
    publishedAt: string | null;
    retrievedAt: string;
    relevanceScore: number;
    sourceType: "academic" | "official_documentation" | "general" | "company_official" | "government" | "established_news" | "community";
}, {
    content: string;
    authorityScore: number;
    authorityTier: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
    usedInAnalysis: boolean;
    sourceTitle: string;
    sourceUrl: string;
    sourceDomain: string;
    publishedAt: string | null;
    retrievedAt: string;
    relevanceScore: number;
    sourceType: "academic" | "official_documentation" | "general" | "company_official" | "government" | "established_news" | "community";
}>;
//# sourceMappingURL=search.validation.d.ts.map