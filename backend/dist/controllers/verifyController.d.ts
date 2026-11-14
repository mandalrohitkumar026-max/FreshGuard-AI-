import { Request, Response } from 'express';
/**
 * POST /api/v1/verify
 *
 * Creates a verification session and starts the SSE stream.
 * Automatically uses In-Memory store if MongoDB is offline.
 */
export declare const startVerification: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/v1/verify/:sessionId
 *
 * Poll session status (alternative to SSE).
 */
export declare const getSessionStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=verifyController.d.ts.map