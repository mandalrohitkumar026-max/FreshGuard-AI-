"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const zodValidationMiddleware_1 = require("../middleware/zodValidationMiddleware");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rateLimitMiddleware_1 = require("../middleware/rateLimitMiddleware");
const validationSchemas_1 = require("../schemas/validationSchemas");
const router = (0, express_1.Router)();
router.post('/register', rateLimitMiddleware_1.authRateLimit, (0, zodValidationMiddleware_1.validate)({ body: validationSchemas_1.registerSchema.shape.body }), authController_1.register);
router.post('/login', rateLimitMiddleware_1.authRateLimit, (0, zodValidationMiddleware_1.validate)({ body: validationSchemas_1.loginSchema.shape.body }), authController_1.login);
router.post('/refresh', (0, zodValidationMiddleware_1.validate)({ body: validationSchemas_1.refreshTokenSchema.shape.body }), authController_1.refresh);
router.post('/logout', authMiddleware_1.authMiddleware, authController_1.logout);
router.get('/me', authMiddleware_1.authMiddleware, authController_1.getMe);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map