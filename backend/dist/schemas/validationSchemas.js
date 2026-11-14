"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyQuerySchema = exports.verifyAnswerSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// ── Auth Schemas ──────────────────────────────
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100),
        email: zod_1.z.string().email('Invalid email address').toLowerCase(),
        password: zod_1.z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email().toLowerCase(),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
exports.refreshTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
    }),
});
// ── Verification Schemas ──────────────────────
exports.verifyAnswerSchema = zod_1.z.object({
    body: zod_1.z.object({
        answerText: zod_1.z
            .string()
            .min(50, 'Answer must be at least 50 characters')
            .max(10000, 'Answer must not exceed 10,000 characters'),
        context: zod_1.z
            .object({
            topic: zod_1.z.string().max(100).optional(),
            sourceModel: zod_1.z.string().max(50).optional(),
        })
            .optional(),
    }),
});
// ── History Query Schemas ─────────────────────
exports.historyQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().min(1).default(1),
        limit: zod_1.z.coerce.number().min(1).max(100).default(20),
        riskLevel: zod_1.z.enum(['FRESH', 'STALE', 'OUTDATED', 'UNVERIFIABLE']).optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
    }),
});
//# sourceMappingURL=validationSchemas.js.map