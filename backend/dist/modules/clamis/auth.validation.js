"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenValidation = exports.loginValidation = exports.registerValidation = void 0;
const zod_1 = require("zod");
exports.registerValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100),
        email: zod_1.z.string().email('Please enter a valid email address'),
        password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    }),
});
exports.loginValidation = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Please enter a valid email address'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
exports.refreshTokenValidation = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
    }),
});
//# sourceMappingURL=auth.validation.js.map