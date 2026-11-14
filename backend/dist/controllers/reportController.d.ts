import { Request, Response } from 'express';
/**
 * GET /api/v1/reports/:reportId
 */
export declare const getReport: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/v1/reports — List user reports (paginated)
 */
export declare const listReports: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/v1/reports/:reportId/share — Generate public permalink
 */
export declare const shareReport: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/v1/reports/public/:slug — Public report (no auth required)
 */
export declare const getPublicReport: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=reportController.d.ts.map