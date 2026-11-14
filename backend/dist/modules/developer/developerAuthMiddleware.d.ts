import { Request, Response, NextFunction } from 'express';
import { DeveloperApiKey } from './apiKeyService';
declare global {
    namespace Express {
        interface Request {
            developerKey?: DeveloperApiKey;
        }
    }
}
export declare const requireApiKey: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=developerAuthMiddleware.d.ts.map