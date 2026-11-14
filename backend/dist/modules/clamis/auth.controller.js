"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const auth_service_1 = require("./auth.service");
class AuthController {
    register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { name, email, password } = req.body;
        const result = await auth_service_1.authService.register(name, email, password);
        return ApiResponse_1.ApiResponse.created(res, result, 'User registered successfully');
    });
    login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { email, password } = req.body;
        const result = await auth_service_1.authService.login(email, password);
        return ApiResponse_1.ApiResponse.ok(res, result, 'Authentication successful');
    });
    refresh = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { refreshToken } = req.body;
        const result = await auth_service_1.authService.refresh(refreshToken);
        return ApiResponse_1.ApiResponse.ok(res, result, 'Token refreshed successfully');
    });
    logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (req.userId) {
            await auth_service_1.authService.logout(req.userId);
        }
        return ApiResponse_1.ApiResponse.ok(res, { message: 'Logged out successfully' }, 'Logged out successfully');
    });
    getMe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        return ApiResponse_1.ApiResponse.ok(res, {
            userId: req.userId,
            email: req.userEmail,
            role: req.userRole || 'user',
        }, 'User profile retrieved');
    });
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map