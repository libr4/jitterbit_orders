import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    const token = await authService.authenticate(username, password);
    res.json({ token });
  } catch (err) {
    next(err);
  }
};
