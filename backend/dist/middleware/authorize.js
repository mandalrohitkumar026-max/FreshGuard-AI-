"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const ApiError_1 = require("../utils/ApiError");
const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.userRole || !roles.includes(req.userRole)) {
            return next(ApiError_1.ApiError.forbidden('You do not have permission to perform this action'));
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=authorize.js.map