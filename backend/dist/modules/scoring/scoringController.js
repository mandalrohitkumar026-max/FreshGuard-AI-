"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoringController = exports.ScoringController = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const ApiError_1 = require("../../utils/ApiError");
const scoring_service_1 = require("./scoring.service");
const verification_service_1 = require("../verification/verification.service");
class ScoringController {
    getConfig = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const config = scoring_service_1.scoringService.getConfig();
        return ApiResponse_1.ApiResponse.ok(res, config, 'Scoring configuration retrieved');
    });
    evaluateClaim = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const claim = req.body;
        if (!claim || !claim.claimText) {
            throw ApiError_1.ApiError.badRequest('claimText is required');
        }
        const result = scoring_service_1.scoringService.evaluateClaim(claim);
        return ApiResponse_1.ApiResponse.ok(res, result, 'Claim evaluated successfully');
    });
    evaluateAnswer = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { claims } = req.body;
        if (!claims || !Array.isArray(claims)) {
            throw ApiError_1.ApiError.badRequest('claims array is required');
        }
        const result = scoring_service_1.scoringService.evaluateAnswer(claims);
        return ApiResponse_1.ApiResponse.ok(res, result, 'Answer evaluated successfully');
    });
    recalculateSession = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const sessionId = String(req.params.sessionId);
        const existingResult = await verification_service_1.verificationService.getVerificationResults(sessionId);
        const scoringInput = (existingResult.claims || []).map((c) => ({
            claimId: c.claimId,
            order: c.order,
            claimText: c.claimText,
            timeSensitivity: (c.status === 'NOT_CHECKED' ? 'STATIC' : 'HIGHLY_DYNAMIC'),
            verdict: c.verdict,
            status: c.status,
            confidence: c.confidence,
            explanation: c.explanation,
            evidence: [...(c.contradictingEvidence || []), ...(c.supportingEvidence || [])],
            conflictAnalysis: c.conflictAnalysis,
        }));
        const evaluated = scoring_service_1.scoringService.evaluateAnswer(scoringInput);
        // Update in-memory and database
        existingResult.summary.overallFreshnessScore = evaluated.overallFreshnessScore;
        existingResult.summary.overallRiskLevel = evaluated.overallRiskLevel;
        existingResult.summary.freshnessInterpretation = evaluated.freshnessInterpretation;
        existingResult.summary.riskExplanation = evaluated.riskExplanation;
        (existingResult.claims || []).forEach((c, idx) => {
            const sc = evaluated.claims[idx];
            if (sc) {
                c.freshnessScore = sc.freshnessScore;
                c.riskLevel = sc.riskLevel;
                c.factors = sc.factors;
                c.recommendedAction = sc.recommendedAction;
            }
        });
        return ApiResponse_1.ApiResponse.ok(res, evaluated, 'Session freshness and risk recalculated successfully');
    });
}
exports.ScoringController = ScoringController;
exports.scoringController = new ScoringController();
//# sourceMappingURL=scoringController.js.map