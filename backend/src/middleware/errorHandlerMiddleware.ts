import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

/**
 * Global Error Handler Middleware
 *
 * Catches all unhandled errors from route handlers (via asyncWrapper).
 * Produces structured JSON error responses with request IDs for tracing.
 */
export function errorHandlerMiddleware(
  err: Error & { status?: number; code?: string },
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = uuidv4();
  const status = err.status ?? 500;
  const isOperational = status < 500;

  if (!isOperational) {
    logger.error('Unhandled error', {
      requestId,
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: req.userId,
    });
  } else {
    logger.warn('Operational error', {
      requestId,
      error: err.message,
      status,
      path: req.path,
    });
  }

  res.status(status).json({
    success: false,
    error: {
      code: err.code ?? (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
      message: isOperational ? err.message : 'An unexpected error occurred',
      requestId,
    },
  });
}

/**
 * 404 Handler — Must be registered AFTER all routes.
 */
export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
