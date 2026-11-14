import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/authService';
import mongoose from 'mongoose';

// Default guest user ID for seamless login-free usage
export const GUEST_USER_ID = new mongoose.Types.ObjectId('000000000000000000000001');
export const GUEST_EMAIL = 'guest@freshguard.ai';

// Extend Express Request
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
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = verifyAccessToken(token);
      req.userId = payload.userId;
      req.userEmail = payload.email;
      return next();
    } catch {
      // Fall through to guest user if token expired or invalid
    }
  }

  // Seamless guest fallback
  req.userId = GUEST_USER_ID.toString();
  req.userEmail = GUEST_EMAIL;
  next();
}
