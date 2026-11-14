import { z } from 'zod';
export declare const createVerificationSchema: z.ZodObject<{
    body: z.ZodObject<{
        originalAnswer: z.ZodString;
        topic: z.ZodOptional<z.ZodString>;
        sourceModel: z.ZodOptional<z.ZodString>;
        stream: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        originalAnswer: string;
        topic?: string | undefined;
        sourceModel?: string | undefined;
        stream?: boolean | undefined;
    }, {
        originalAnswer: string;
        topic?: string | undefined;
        sourceModel?: string | undefined;
        stream?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        originalAnswer: string;
        topic?: string | undefined;
        sourceModel?: string | undefined;
        stream?: boolean | undefined;
    };
}, {
    body: {
        originalAnswer: string;
        topic?: string | undefined;
        sourceModel?: string | undefined;
        stream?: boolean | undefined;
    };
}>;
export declare const verificationIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
}, {
    params: {
        id: string;
    };
}>;
export declare const verificationQuerySchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodObject<{
        page: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
        limit: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
        riskLevel: z.ZodOptional<z.ZodEnum<["FRESH", "STALE", "OUTDATED", "UNVERIFIABLE"]>>;
    }, "strip", z.ZodTypeAny, {
        limit?: number | undefined;
        riskLevel?: "FRESH" | "STALE" | "OUTDATED" | "UNVERIFIABLE" | undefined;
        page?: number | undefined;
    }, {
        limit?: string | undefined;
        riskLevel?: "FRESH" | "STALE" | "OUTDATED" | "UNVERIFIABLE" | undefined;
        page?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    query?: {
        limit?: number | undefined;
        riskLevel?: "FRESH" | "STALE" | "OUTDATED" | "UNVERIFIABLE" | undefined;
        page?: number | undefined;
    } | undefined;
}, {
    query?: {
        limit?: string | undefined;
        riskLevel?: "FRESH" | "STALE" | "OUTDATED" | "UNVERIFIABLE" | undefined;
        page?: string | undefined;
    } | undefined;
}>;
//# sourceMappingURL=verification.validation.d.ts.map