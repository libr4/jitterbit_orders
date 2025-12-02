import { Request } from 'express';
import createError from 'http-errors';

/**
 * Extract JWT token from request:
 * - First checks for token in httpOnly cookie (set by /auth/login)
 * - Falls back to Authorization header (Bearer <token>)
 * Throws 401 if no token found.
 */
export const extractToken = (req: Request): string => {
  // Try cookie first (httpOnly cookie set by login endpoint)
  if ((req as any).cookies && (req as any).cookies.token) {
    return (req as any).cookies.token;
  }

  // Fallback to Authorization header
  const auth = req.headers['authorization'];
  if (!auth) {
    throw createError(401, 'Missing Authorization token', { code: 'AUTH_ERROR' });
  }

  const token = parseBearerToken(auth);
  return token;
};

/**
 * Parse "Bearer <token>" from Authorization header string.
 * Throws 401 if format is invalid.
 */
export const parseBearerToken = (authHeader: string | string[]): string => {
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const parts = header.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw createError(401, 'Invalid Authorization header format', { code: 'AUTH_ERROR' });
  }

  return parts[1];
};
