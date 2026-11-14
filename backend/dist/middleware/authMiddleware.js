"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GUEST_EMAIL = exports.GUEST_USER_ID = void 0;
exports.authMiddleware = authMiddleware;
const authService_1 = require("../services/authService");
const mongoose_1 = __importDefault(require("mongoose"));
// Default guest user ID for seamless login-free usage
exports.GUEST_USER_ID = new mongoose_1.default.Types.ObjectId('000000000000000000000001');
exports.GUEST_EMAIL = 'guest@freshguard.ai';
/**
 * Auth Middleware (Guest / Open Mode)
 *
 * Automatically assigns a guest session if no token is provided,
 * allowing instant, friction-free verification without mandatory login.
 */
async function authMiddleware(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            const payload = (0, authService_1.verifyAccessToken)(token);
            req.userId = payload.userId;
            req.userEmail = payload.email;
            return next();
        }
        catch {
            // Fall through to guest user if token expired or invalid
        }
    }
    // Seamless guest fallback
    req.userId = exports.GUEST_USER_ID.toString();
    req.userEmail = exports.GUEST_EMAIL;
    next();
}
//# sourceMappingURL=authMiddleware.js.map