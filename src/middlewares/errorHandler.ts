import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../errors/domain/DomainError';
import logger from '../utils/logger';

/**
 * Maps domain error codes to HTTP status codes.
 * This is the single source of truth for error-to-HTTP mapping.
 */
const domainErrorToHttpStatus: Record<string, number> = {
  'NOT_FOUND': 404,
  'DUPLICATE_ORDER': 409,
  'DUPLICATE_ENTITY': 409,
  'INVALID_INPUT': 400,
  'INVALID_ITEM_ID': 400,
  'UNAUTHORIZED': 401,
  'AUTH_ERROR': 401,
  'INVALID_TOKEN': 401,
  'FORBIDDEN': 403,
  'VALIDATION_ERROR': 400
};

/**
 * Global error handling middleware.
 * 
 * This is the ONLY place allowed to:
 * - Convert domain errors to HTTP status codes
 * - Format JSON error responses
 * - Set status and response shape
 * 
 * Controllers, services, and middleware must not translate errors;
 * they only throw or pass domain errors here.
 */
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error once via centralized logger. Include requestId when available.
  const requestId = (req as any).requestId;
  logger.error(`${err.name}: ${err.message}`, { requestId, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });

  // Handle domain errors
  if (err instanceof DomainError) {
    const status = domainErrorToHttpStatus[err.code] || 500;
    return res.status(status).json({
      error: {
        code: err.code,
        message: err.message,
        requestId
      }
    });
  }

  // Handle generic http-errors (from validation, etc)
  const status = (err as any).status || (err as any).statusCode || 500;
  const code = (err as any).code || 'INTERNAL_ERROR';
  const message = err.message || 'An error occurred';

  res.status(status).json({
    error: {
      code,
      message,
      requestId
    }
  });
};

export default errorHandler;
