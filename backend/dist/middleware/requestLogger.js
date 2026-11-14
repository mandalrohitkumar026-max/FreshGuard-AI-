"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_1 = require("../config/logger");
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, originalUrl } = req;
        const { statusCode } = res;
        const logPayload = {
            method,
            url: originalUrl,
            status: statusCode,
            durationMs: duration,
            ip: req.ip,
            userAgent: req.get('user-agent'),
        };
        if (statusCode >= 500) {
            logger_1.logger.error(`HTTP ${method} ${originalUrl} ${statusCode} - ${duration}ms`, logPayload);
        }
        else if (statusCode >= 400) {
            logger_1.logger.warn(`HTTP ${method} ${originalUrl} ${statusCode} - ${duration}ms`, logPayload);
        }
        else {
            logger_1.logger.info(`HTTP ${method} ${originalUrl} ${statusCode} - ${duration}ms`, logPayload);
        }
    });
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=requestLogger.js.map