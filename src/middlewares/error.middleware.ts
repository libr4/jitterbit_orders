import { Request, Response, NextFunction } from 'express';

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 400 ? 'VALIDATION_ERROR' : status === 401 ? 'AUTH_ERROR' : status === 404 ? 'NOT_FOUND' : 'UNKNOWN_ERROR');
  const message = err.message || 'An error occurred';
  const details = err.details || undefined;

  res.status(status).json({ error: { code, message, details } });
};

export default errorMiddleware;
