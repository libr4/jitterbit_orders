import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import createError from 'http-errors';

export interface AuthRequest extends Request {
  user?: any;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.path === '/docs' || req.path.startsWith('/docs/')) return next();
  if (req.path === '/auth/login') return next();

  const auth = req.headers['authorization'];
  if (!auth) return next(createError(401, 'Missing Authorization header', { code: 'AUTH_ERROR' }));
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return next(createError(401, 'Invalid Authorization header', { code: 'AUTH_ERROR' }));

  const token = parts[1];

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return next(createError(401, 'Invalid token', { code: 'AUTH_ERROR' }));
  }
};

export default authMiddleware;
