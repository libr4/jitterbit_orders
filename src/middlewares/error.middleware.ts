import { Request, Response, NextFunction } from 'express';
import { mapErrorCode } from '../utils/error';

/**
 * @deprecated Use errorHandler from ./errorHandler.ts instead
 * This middleware is kept for backwards compatibility only.
 * All new error handling goes through the global errorHandler.
 */
const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const code = err.code || mapErrorCode(status);
  const message = err.message || 'An error occurred';
  const details = err.details || undefined;

  res.status(status).json({ error: { code, message, details } });
};

export default errorMiddleware;
