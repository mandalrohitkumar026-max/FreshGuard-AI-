import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async Express route handler to automatically catch errors
 * and pass them to the next() error handler — avoids try/catch boilerplate.
 */
export const asyncWrapper = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
