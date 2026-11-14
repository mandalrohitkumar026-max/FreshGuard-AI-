import { z } from 'zod';
export declare const developerVerifySchema: z.ZodObject<{
    answerText: z.ZodString;
    topic: z.ZodOptional<z.ZodString>;
    strictness: z.ZodDefault<z.ZodEnum<["strict", "balanced", "permissive"]>>;
    sourceModel: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    answerText: string;
    strictness: "strict" | "balanced" | "permissive";
    topic?: string | undefined;
    sourceModel?: string | undefined;
}, {
    answerText: string;
    topic?: string | undefined;
    sourceModel?: string | undefined;
    strictness?: "strict" | "balanced" | "permissive" | undefined;
}>;
export declare class DeveloperController {
    /**
     * POST /api/v1/developer/verify
     * Submits an AI answer for real-time fact and freshness verification.
     */
    verify: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * GET /api/v1/developer/reports/:id
     */
    getReport: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * GET /api/v1/developer/conflicts/:id
     */
    getConflicts: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * GET /api/v1/developer/audit-trail/:id
     */
    getAuditTrail: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * POST /api/v1/developer/keys
     */
    createKey: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * GET /api/v1/developer/keys
     */
    listKeys: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * DELETE /api/v1/developer/keys/:id
     */
    revokeKey: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
}
export declare const developerController: DeveloperController;
//# sourceMappingURL=developerController.d.ts.map