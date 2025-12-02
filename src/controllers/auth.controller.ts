import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    const { token, maxAge } = authService.authenticate(username, password);

    // Set httpOnly cookie with optional maxAge
    const cookieOpts: Record<string, unknown> = {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    };
    if (maxAge) cookieOpts.maxAge = maxAge;

    res.cookie('token', token, cookieOpts);
    res.json({ token });
  } catch (err) {
    next(err);
  }
};
