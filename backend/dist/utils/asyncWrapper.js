"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncWrapper = void 0;
/**
 * Wraps an async Express route handler to automatically catch errors
 * and pass them to the next() error handler — avoids try/catch boilerplate.
 */
const asyncWrapper = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncWrapper = asyncWrapper;
//# sourceMappingURL=asyncWrapper.js.map