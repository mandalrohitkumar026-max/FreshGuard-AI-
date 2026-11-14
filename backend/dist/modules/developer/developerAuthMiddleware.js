"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireApiKey = void 0;
const apiKeyService_1 = require("./apiKeyService");
// In-memory request counters for rate limiting: keyId -> { count, resetTime }
const rateLimitMap = new Map();
const requireApiKey = (req, res, next) => {
    let rawKey = req.headers['x-api-key'];
    if (!rawKey && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
            rawKey = parts[1];
        }
    }
    if (!rawKey) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED_API_KEY',
                message: 'Authentication required: Provide a valid API key via x-api-key header or Authorization: Bearer fg_live_...',
            },
        });
    }
    const keyObj = apiKeyService_1.apiKeyService.validateKey(rawKey);
    if (!keyObj) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_API_KEY',
                message: 'Invalid or revoked developer API key.',
            },
        });
    }
    // Rate Limiting (60 req/min per key)
    const now = Date.now();
    const limitWindow = 60000; // 1 minute
    const keyRate = rateLimitMap.get(keyObj.id) || { count: 0, resetTime: now + limitWindow };
    if (now > keyRate.resetTime) {
        keyRate.count = 1;
        keyRate.resetTime = now + limitWindow;
    }
    else {
        keyRate.count += 1;
    }
    rateLimitMap.set(keyObj.id, keyRate);
    if (keyRate.count > keyObj.rateLimitPerMinute) {
        const retryAfter = Math.ceil((keyRate.resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: `Rate limit of ${keyObj.rateLimitPerMinute} requests/minute exceeded. Retry after ${retryAfter}s.`,
            },
        });
    }
    req.developerKey = keyObj;
    req.userId = keyObj.userId;
    return next();
};
exports.requireApiKey = requireApiKey;
//# sourceMappingURL=developerAuthMiddleware.js.map