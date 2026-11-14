/** General API rate limit — 60 req/min per IP */
export declare const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
/** Verification rate limit — 5 verifications/min per IP */
export declare const verifyRateLimit: import("express-rate-limit").RateLimitRequestHandler;
/** Auth rate limit — 10 attempts per 15 min per IP */
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimitMiddleware.d.ts.map