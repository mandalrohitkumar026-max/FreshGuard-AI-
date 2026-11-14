"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const search_controller_1 = require("./search.controller");
const zodValidationMiddleware_1 = require("../../middleware/zodValidationMiddleware");
const authenticate_1 = require("../../middleware/authenticate");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const search_validation_1 = require("./search.validation");
const router = (0, express_1.Router)();
router.get('/health', search_controller_1.searchController.getTavilyHealth);
router.get('/history', authenticate_1.optionalAuthenticate, search_controller_1.searchController.getSearchHistory);
router.post('/query', authenticate_1.optionalAuthenticate, rateLimiter_1.verifyRateLimiter, (0, zodValidationMiddleware_1.validate)({ body: search_validation_1.searchQueryRequestSchema.shape.body }), search_controller_1.searchController.searchQuery);
router.post('/evidence', authenticate_1.optionalAuthenticate, rateLimiter_1.verifyRateLimiter, (0, zodValidationMiddleware_1.validate)({ body: search_validation_1.claimEvidenceRequestSchema.shape.body }), search_controller_1.searchController.searchEvidence);
exports.default = router;
//# sourceMappingURL=search.routes.js.map