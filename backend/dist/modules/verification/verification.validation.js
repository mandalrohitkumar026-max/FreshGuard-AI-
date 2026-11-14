"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationQuerySchema = exports.verificationIdParamSchema = exports.createVerificationSchema = void 0;
const zod_1 = require("zod");
exports.createVerificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        originalAnswer: zod_1.z
            .string()
            .min(10, 'Answer must be at least 10 characters long')
            .max(10000, 'Answer must not exceed 10,000 characters'),
        topic: zod_1.z.string().max(100).optional(),
        sourceModel: zod_1.z.string().max(50).optional(),
        stream: zod_1.z.boolean().optional(),
    }),
});
exports.verificationIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Verification ID is required'),
    }),
});
exports.verificationQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        riskLevel: zod_1.z.enum(['FRESH', 'STALE', 'OUTDATED', 'UNVERIFIABLE']).optional(),
    }).optional(),
});
//# sourceMappingURL=verification.validation.js.map