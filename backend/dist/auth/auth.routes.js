"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const zodValidationMiddleware_1 = require("../../middleware/zodValidationMiddleware");
const authenticate_1 = require("../../middleware/authenticate");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const auth_validation_1 = require("./auth.validation");
const router = (0, express_1.Router)();
router.post('/register', rateLimiter_1.authRateLimiter, (0, zodValidationMiddleware_1.validate)({ body: auth_validation_1.registerValidation.shape.body }), auth_controller_1.authController.register);
router.post('/login', rateLimiter_1.authRateLimiter, (0, zodValidationMiddleware_1.validate)({ body: auth_validation_1.loginValidation.shape.body }), auth_controller_1.authController.login);
router.post('/refresh', (0, zodValidationMiddleware_1.validate)({ body: auth_validation_1.refreshTokenValidation.shape.body }), auth_controller_1.authController.refresh);
router.post('/logout', authenticate_1.authenticate, auth_controller_1.authController.logout);
router.get('/me', authenticate_1.authenticate, auth_controller_1.authController.getMe);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map