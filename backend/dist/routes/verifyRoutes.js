"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verifyController_1 = require("../controllers/verifyController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rateLimitMiddleware_1 = require("../middleware/rateLimitMiddleware");
const zodValidationMiddleware_1 = require("../middleware/zodValidationMiddleware");
const validationSchemas_1 = require("../schemas/validationSchemas");
const router = (0, express_1.Router)();
// All verify routes require authentication
router.use(authMiddleware_1.authMiddleware);
/**
 * POST /api/v1/verify
 * Starts verification — opens an SSE stream immediately.
 */
router.post('/', rateLimitMiddleware_1.verifyRateLimit, (0, zodValidationMiddleware_1.validate)({ body: validationSchemas_1.verifyAnswerSchema.shape.body }), verifyController_1.startVerification);
/**
 * GET /api/v1/verify/:sessionId
 * Poll session status (alternative to SSE).
 */
router.get('/:sessionId', verifyController_1.getSessionStatus);
exports.default = router;
//# sourceMappingURL=verifyRoutes.js.map