"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimit = exports.verifyRateLimit = exports.generalRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
const rateLimitResponse = (message) => ({
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message },
});
/** General API rate limit — 60 req/min per IP */
exports.generalRateLimit = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_MAX_GENERAL,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json(rateLimitResponse('Too many requests. Please slow down.'));
    },
});
/** Verification rate limit — 5 verifications/min per IP */
exports.verifyRateLimit = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_MAX_VERIFY,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.userId ?? req.ip ?? 'anonymous',
    handler: (_req, res) => {
        res.status(429).json(rateLimitResponse('Verification rate limit reached. Try again in a minute.'));
    },
});
/** Auth rate limit — 10 attempts per 15 min per IP */
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 900_000, // 15 minutes
    max: env_1.env.RATE_LIMIT_MAX_AUTH,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json(rateLimitResponse('Too many auth attempts. Try again in 15 minutes.'));
    },
});
//# sourceMappingURL=rateLimitMiddleware.js.map