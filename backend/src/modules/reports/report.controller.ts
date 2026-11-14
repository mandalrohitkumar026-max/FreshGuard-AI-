import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { reportService } from './report.service';

export class ReportController {
  getReport = asyncHandler(async (req: Request, res: Response) => {
    const reportId = String(req.params.reportId || req.params.id);
    const report = await reportService.getReport(reportId, req.userId, req.userRole);
    return ApiResponse.ok(res, report, 'Verification report retrieved');
  });

  shareReport = asyncHandler(async (req: Request, res: Response) => {
    const reportId = String(req.params.reportId || req.params.id);
    const result = await reportService.shareReport(reportId);
    return ApiResponse.ok(res, result, 'Report shared successfully');
  });
}

export const reportController = new ReportController();
