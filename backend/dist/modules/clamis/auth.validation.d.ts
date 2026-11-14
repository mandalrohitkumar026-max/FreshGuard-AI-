import { z } from 'zod';
export declare const registerValidation: z.ZodObject<{
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
export declare const loginValidation: z.ZodObject<{
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
export declare const refreshTokenValidation: z.ZodObject<{
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
export type RegisterInput = z.infer<typeof registerValidation>['body'];
export type LoginInput = z.infer<typeof loginValidation>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenValidation>['body'];
//# sourceMappingURL=auth.validation.d.ts.map