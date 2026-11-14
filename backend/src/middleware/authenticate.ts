import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { JwtPayload } from '../types/verification.types';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authentication token is required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload & { role?: 'user' | 'admin' };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userRole = decoded.role || 'user';
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
    };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token has expired'));
    }
    return next(ApiError.unauthorized('Invalid authentication token'));
  }
};

/**
 * Optional authentication: populates req.userId if valid Bearer token provided,
 * otherwise sets guest user defaults without throwing an error.
 */
export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.userId = '000000000000000000000001';
    req.userEmail = 'guest@freshguard.ai';
    req.userRole = 'user';
    req.user = {
      userId: req.userId,
      email: req.userEmail,
      role: 'user',
    };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload & { role?: 'user' | 'admin' };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userRole = decoded.role || 'user';
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
    };
  } catch {
    // If token invalid, default to guest
    req.userId = '000000000000000000000001';
    req.userEmail = 'guest@freshguard.ai';
    req.userRole = 'user';
    req.user = {
      userId: req.userId,
      email: req.userEmail,
      role: 'user',
    };
  }
  next();
};
