import { Request, Response, NextFunction } from 'express';
export declare const authenticate: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Optional authentication: populates req.userId if valid Bearer token provided,
 * otherwise sets guest user defaults without throwing an error.
 */
export declare const optionalAuthenticate: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=authenticate.d.ts.map