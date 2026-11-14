import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
interface ValidationSchemas {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}
/**
 * Zod Validation Middleware
 *
 * Validates request body, query, and/or params against Zod schemas.
 * Returns structured 400 errors with field-level details.
 */
export declare function validate(schemas: ValidationSchemas): (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=zodValidationMiddleware.d.ts.map