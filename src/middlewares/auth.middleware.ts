import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { extractToken } from '../utils/token';
import { TokenPayload } from '../services/auth.service';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/**
 * Verify JWT token and attach decoded payload to req.user.
 * Expects token in cookie (set by /auth/login) or Authorization: Bearer <token> header.
 * Route-level whitelisting is handled at the route/app level, not here.
 * 
 * All errors are passed to the global error handler for consistent HTTP formatting.
 */
const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    const payload = authService.verify(token);
    req.user = payload;
    next();
  } catch (err) {
    // Pass domain errors to global error handler
    next(err);
  }
};

export default authMiddleware;
