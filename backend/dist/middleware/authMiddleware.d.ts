import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
export declare const GUEST_USER_ID: mongoose.Types.ObjectId;
export declare const GUEST_EMAIL = "guest@freshguard.ai";
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            userEmail?: string;
        }
    }
}
/**
 * Auth Middleware (Guest / Open Mode)
 *
 * Automatically assigns a guest session if no token is provided,
 * allowing instant, friction-free verification without mandatory login.
 */
export declare function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=authMiddleware.d.ts.map