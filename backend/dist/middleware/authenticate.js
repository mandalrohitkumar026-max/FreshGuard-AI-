"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const ApiError_1 = require("../utils/ApiError");
const authenticate = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(ApiError_1.ApiError.unauthorized('Authentication token is required'));
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.userRole = decoded.role || 'user';
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role || 'user',
        };
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(ApiError_1.ApiError.unauthorized('Token has expired'));
        }
        return next(ApiError_1.ApiError.unauthorized('Invalid authentication token'));
    }
};
exports.authenticate = authenticate;
/**
 * Optional authentication: populates req.userId if valid Bearer token provided,
 * otherwise sets guest user defaults without throwing an error.
 */
const optionalAuthenticate = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.userId = '000000000000000000000001';
        req.userEmail = 'guest@freshguard.ai';
        req.userRole = 'user';
        req.user = {
            userId: req.userId,
            email: req.userEmail,
            role: 'user',
        };
        return next();
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.userRole = decoded.role || 'user';
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role || 'user',
        };
    }
    catch {
        // If token invalid, default to guest
        req.userId = '000000000000000000000001';
        req.userEmail = 'guest@freshguard.ai';
        req.userRole = 'user';
        req.user = {
            userId: req.userId,
            email: req.userEmail,
            role: 'user',
        };
    }
    next();
};
exports.optionalAuthenticate = optionalAuthenticate;
//# sourceMappingURL=authenticate.js.map