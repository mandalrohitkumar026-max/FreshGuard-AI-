"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = void 0;
const zod_1 = require("zod");
const ApiError_1 = require("../utils/ApiError");
const logger_1 = require("../config/logger");
const errorHandler = (err, _req, res, _next) => {
    let statusCode = 500;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details = [];
    if (err instanceof ApiError_1.ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.statusCode === 400 ? 'BAD_REQUEST'
            : err.statusCode === 401 ? 'UNAUTHORIZED'
                : err.statusCode === 403 ? 'FORBIDDEN'
                    : err.statusCode === 404 ? 'NOT_FOUND'
                        : err.statusCode === 409 ? 'CONFLICT'
                            : 'API_ERROR';
        details = err.errors || [];
    }
    else if (err instanceof zod_1.ZodError) {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = 'Validation failed for request parameters';
        details = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
    }
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        code = 'MONGOOSE_VALIDATION_ERROR';
        message = err.message;
    }
    else if (err.name === 'CastError') {
        statusCode = 400;
        code = 'INVALID_ID_FORMAT';
        message = `Invalid ${err.path}: ${err.value}`;
    }
    else if (err.code === 11000) {
        statusCode = 409;
        code = 'DUPLICATE_KEY_ERROR';
        message = 'A resource with that identifier already exists';
    }
    else if (err.status) {
        statusCode = err.status;
        message = err.message;
    }
    if (statusCode >= 500) {
        logger_1.logger.error('Unhandled Server Error', { error: err.message, stack: err.stack });
    }
    return res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
            ...(details.length > 0 ? { details } : {}),
        },
    });
};
exports.errorHandler = errorHandler;
const notFound = (_req, res) => {
    return res.status(404).json({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: 'The requested resource was not found on this server',
        },
    });
};
exports.notFound = notFound;
//# sourceMappingURL=errorHandler.js.map