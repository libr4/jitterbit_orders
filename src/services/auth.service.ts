import config from '../config';
import jwt from 'jsonwebtoken';
import createError from 'http-errors';

const authenticate = async (username: string, password: string) => {
  if (username === config.DEV_AUTH_USER && password === config.DEV_AUTH_PASS) {
    const token = jwt.sign({ username } as any, config.JWT_SECRET as any, { expiresIn: config.JWT_EXPIRES_IN as any } as any);
    return token;
  }
  throw createError(401, 'Invalid credentials', { code: 'AUTH_ERROR' });
};

export default { authenticate };
