"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportController = exports.ReportController = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const report_service_1 = require("./report.service");
class ReportController {
    getReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const reportId = String(req.params.reportId || req.params.id);
        const report = await report_service_1.reportService.getReport(reportId, req.userId, req.userRole);
        return ApiResponse_1.ApiResponse.ok(res, report, 'Verification report retrieved');
    });
    shareReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const reportId = String(req.params.reportId || req.params.id);
        const result = await report_service_1.reportService.shareReport(reportId);
        return ApiResponse_1.ApiResponse.ok(res, result, 'Report shared successfully');
    });
}
exports.ReportController = ReportController;
exports.reportController = new ReportController();
//# sourceMappingURL=report.controller.js.map