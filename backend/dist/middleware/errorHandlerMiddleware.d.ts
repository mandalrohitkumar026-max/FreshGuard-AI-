import { Request, Response, NextFunction } from 'express';
/**
 * Global Error Handler Middleware
 *
 * Catches all unhandled errors from route handlers (via asyncWrapper).
 * Produces structured JSON error responses with request IDs for tracing.
 */
export declare function errorHandlerMiddleware(err: Error & {
    status?: number;
    code?: string;
}, req: Request, res: Response, _next: NextFunction): void;
/**
 * 404 Handler — Must be registered AFTER all routes.
 */
export declare function notFoundMiddleware(req: Request, res: Response): void;
//# sourceMappingURL=errorHandlerMiddleware.d.ts.map