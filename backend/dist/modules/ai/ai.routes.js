"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("./ai.controller");
const zodValidationMiddleware_1 = require("../../middleware/zodValidationMiddleware");
const authenticate_1 = require("../../middleware/authenticate");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const ai_validation_1 = require("./ai.validation");
const router = (0, express_1.Router)();
router.get('/health', ai_controller_1.aiController.getBifrostHealth);
router.post('/extract-claims', authenticate_1.optionalAuthenticate, rateLimiter_1.verifyRateLimiter, (0, zodValidationMiddleware_1.validate)({ body: ai_validation_1.extractClaimsRequestSchema.shape.body }), ai_controller_1.aiController.extractClaims);
router.post('/analyze-claims', authenticate_1.optionalAuthenticate, rateLimiter_1.verifyRateLimiter, (0, zodValidationMiddleware_1.validate)({ body: ai_validation_1.analyzeClaimsRequestSchema.shape.body }), ai_controller_1.aiController.analyzeClaims);
router.post('/analyze-evidence', authenticate_1.optionalAuthenticate, rateLimiter_1.verifyRateLimiter, (0, zodValidationMiddleware_1.validate)({ body: ai_validation_1.analyzeEvidenceRequestSchema.shape.body }), ai_controller_1.aiController.analyzeEvidence);
router.post('/generate-correction', authenticate_1.optionalAuthenticate, rateLimiter_1.verifyRateLimiter, (0, zodValidationMiddleware_1.validate)({ body: ai_validation_1.generateCorrectionRequestSchema.shape.body }), ai_controller_1.aiController.generateCorrection);
exports.default = router;
//# sourceMappingURL=ai.routes.js.map