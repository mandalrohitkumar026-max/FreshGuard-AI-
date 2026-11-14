import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email: string;
        password: string;
    }, {
        name: string;
        email: string;
        password: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        email: string;
        password: string;
    };
}, {
    body: {
        name: string;
        email: string;
        password: string;
    };
}>;
export declare const loginSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
    }, {
        email: string;
        password: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        password: string;
    };
}, {
    body: {
        email: string;
        password: string;
    };
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    body: z.ZodObject<{
        refreshToken: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        refreshToken: string;
    }, {
        refreshToken: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        refreshToken: string;
    };
}, {
    body: {
        refreshToken: string;
    };
}>;
export declare const verifyAnswerSchema: z.ZodObject<{
    body: z.ZodObject<{
        answerText: z.ZodString;
        context: z.ZodOptional<z.ZodObject<{
            topic: z.ZodOptional<z.ZodString>;
            sourceModel: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            topic?: string | undefined;
            sourceModel?: string | undefined;
        }, {
            topic?: string | undefined;
            sourceModel?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        answerText: string;
        context?: {
            topic?: string | undefined;
            sourceModel?: string | undefined;
        } | undefined;
    }, {
        answerText: string;
        context?: {
            topic?: string | undefined;
            sourceModel?: string | undefined;
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        answerText: string;
        context?: {
            topic?: string | undefined;
            sourceModel?: string | undefined;
        } | undefined;
    };
}, {
    body: {
        answerText: string;
        context?: {
            topic?: string | undefined;
            sourceModel?: string | undefined;
        } | undefined;
    };
}>;
export declare const historyQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        riskLevel: z.ZodOptional<z.ZodEnum<["FRESH", "STALE", "OUTDATED", "UNVERIFIABLE"]>>;
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        page: number;
        riskLevel?: "FRESH" | "STALE" | "OUTDATED" | "UNVERIFIABLE" | undefined;
        endDate?: string | undefined;
        startDate?: string | undefined;
    }, {
        limit?: number | undefined;
        riskLevel?: "FRESH" | "STALE" | "OUTDATED" | "UNVERIFIABLE" | undefined;
        page?: number | undefined;
        endDate?: string | undefined;
        startDate?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        limit: number;
        page: number;
        riskLevel?: "FRESH" | "STALE" | "OUTDATED" | "UNVERIFIABLE" | undefined;
        endDate?: string | undefined;
        startDate?: string | undefined;
    };
}, {
    query: {
        limit?: number | undefined;
        riskLevel?: "FRESH" | "STALE" | "OUTDATED" | "UNVERIFIABLE" | undefined;
        page?: number | undefined;
        endDate?: string | undefined;
        startDate?: string | undefined;
    };
}>;
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type VerifyAnswerInput = z.infer<typeof verifyAnswerSchema>['body'];
export type HistoryQuery = z.infer<typeof historyQuerySchema>['query'];
//# sourceMappingURL=validationSchemas.d.ts.map