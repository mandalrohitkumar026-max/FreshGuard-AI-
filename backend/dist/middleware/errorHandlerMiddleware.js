"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandlerMiddleware = errorHandlerMiddleware;
exports.notFoundMiddleware = notFoundMiddleware;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
/**
 * Global Error Handler Middleware
 *
 * Catches all unhandled errors from route handlers (via asyncWrapper).
 * Produces structured JSON error responses with request IDs for tracing.
 */
function errorHandlerMiddleware(err, req, res, _next) {
    const requestId = (0, uuid_1.v4)();
    const status = err.status ?? 500;
    const isOperational = status < 500;
    if (!isOperational) {
        logger_1.logger.error('Unhandled error', {
            requestId,
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            userId: req.userId,
        });
    }
    else {
        logger_1.logger.warn('Operational error', {
            requestId,
            error: err.message,
            status,
            path: req.path,
        });
    }
    res.status(status).json({
        success: false,
        error: {
            code: err.code ?? (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
            message: isOperational ? err.message : 'An unexpected error occurred',
            requestId,
        },
    });
}
/**
 * 404 Handler — Must be registered AFTER all routes.
 */
function notFoundMiddleware(req, res) {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
    });
}
//# sourceMappingURL=errorHandlerMiddleware.js.map