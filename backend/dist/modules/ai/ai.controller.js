"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiController = exports.AIController = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const ai_service_1 = require("./ai.service");
const ai_gateway_1 = require("./ai.gateway");
class AIController {
    getBifrostHealth = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const health = await ai_gateway_1.aiGateway.checkHealth();
        return ApiResponse_1.ApiResponse.ok(res, health, 'Bifrost AI Gateway health retrieved');
    });
    extractClaims = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { answerText, topicHint, model } = req.body;
        const result = await ai_service_1.aiService.extractClaims(answerText, topicHint, model);
        return ApiResponse_1.ApiResponse.ok(res, result, 'Factual claims extracted successfully');
    });
    analyzeClaims = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { claims, model } = req.body;
        const result = await ai_service_1.aiService.analyzeTimeSensitivity(claims, model);
        return ApiResponse_1.ApiResponse.ok(res, result, 'Claim time sensitivity analyzed successfully');
    });
    analyzeEvidence = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { claimText, evidence, model } = req.body;
        const result = await ai_service_1.aiService.analyzeEvidence(claimText, evidence, model);
        return ApiResponse_1.ApiResponse.ok(res, result, 'Evidence analyzed successfully against claim');
    });
    generateCorrection = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { originalAnswer, claims, model } = req.body;
        const result = await ai_service_1.aiService.generateCorrection(originalAnswer, claims, model);
        return ApiResponse_1.ApiResponse.ok(res, result, 'Corrected answer generated successfully');
    });
}
exports.AIController = AIController;
exports.aiController = new AIController();
//# sourceMappingURL=ai.controller.js.map