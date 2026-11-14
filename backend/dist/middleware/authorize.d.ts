import { Request, Response, NextFunction } from 'express';
export declare const authorize: (...roles: ("user" | "admin")[]) => (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=authorize.d.ts.map