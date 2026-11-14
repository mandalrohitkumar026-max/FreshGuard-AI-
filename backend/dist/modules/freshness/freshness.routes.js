"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const freshness_controller_1 = require("./freshness.controller");
const zodValidationMiddleware_1 = require("../../middleware/zodValidationMiddleware");
const authenticate_1 = require("../../middleware/authenticate");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const freshness_validation_1 = require("./freshness.validation");
const router = (0, express_1.Router)();
router.post('/analyze', authenticate_1.optionalAuthenticate, rateLimiter_1.verifyRateLimiter, (0, zodValidationMiddleware_1.validate)({ body: freshness_validation_1.analyzeFreshnessApiRequestSchema.shape.body }), freshness_controller_1.freshnessController.analyzeFreshness);
router.get('/:verificationId', authenticate_1.optionalAuthenticate, freshness_controller_1.freshnessController.getFreshnessByVerificationId);
exports.default = router;
//# sourceMappingURL=freshness.routes.js.map