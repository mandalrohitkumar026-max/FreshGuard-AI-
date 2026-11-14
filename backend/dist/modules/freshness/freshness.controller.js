"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.freshnessController = exports.FreshnessController = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const freshnessDetectionService_1 = require("./freshnessDetectionService");
class FreshnessController {
    /**
     * POST /api/v1/freshness/analyze
     * Evaluates time sensitivity, priority, volatility, and verification requirement for claims.
     */
    analyzeFreshness = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { verificationId, claims, answerText, topicHint, model } = req.body;
        const userId = req.user?._id?.toString();
        const input = answerText || claims || [];
        const result = await freshnessDetectionService_1.freshnessDetectionService.analyzeFreshness(input, {
            verificationId,
            userId,
            model,
            persistToDb: true,
        });
        return ApiResponse_1.ApiResponse.ok(res, result, 'Temporal freshness analysis completed successfully');
    });
    /**
     * GET /api/v1/freshness/:verificationId
     * Retrieves freshness detection results for a verification session.
     */
    getFreshnessByVerificationId = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const verificationId = String(req.params.verificationId);
        const analysis = await freshnessDetectionService_1.freshnessDetectionService.getFreshnessByVerificationId(verificationId);
        return ApiResponse_1.ApiResponse.ok(res, {
            verificationId,
            totalClaims: analysis.length,
            timeSensitiveCount: analysis.filter((a) => a.isTimeSensitive).length,
            stableCount: analysis.filter((a) => !a.isTimeSensitive).length,
            analysis,
        }, 'Verification freshness analysis retrieved successfully');
    });
}
exports.FreshnessController = FreshnessController;
exports.freshnessController = new FreshnessController();
//# sourceMappingURL=freshness.controller.js.map