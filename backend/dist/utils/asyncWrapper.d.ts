import { Request, Response, NextFunction } from 'express';
/**
 * Wraps an async Express route handler to automatically catch errors
 * and pass them to the next() error handler — avoids try/catch boilerplate.
 */
export declare const asyncWrapper: (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=asyncWrapper.d.ts.map