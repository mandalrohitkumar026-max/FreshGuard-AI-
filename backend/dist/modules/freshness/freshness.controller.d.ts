export declare class FreshnessController {
    /**
     * POST /api/v1/freshness/analyze
     * Evaluates time sensitivity, priority, volatility, and verification requirement for claims.
     */
    analyzeFreshness: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * GET /api/v1/freshness/:verificationId
     * Retrieves freshness detection results for a verification session.
     */
    getFreshnessByVerificationId: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
}
export declare const freshnessController: FreshnessController;
//# sourceMappingURL=freshness.controller.d.ts.map