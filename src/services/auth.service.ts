import config from '../config';
import jwt, { JwtPayload, Secret, SignOptions, VerifyOptions } from 'jsonwebtoken';
import { UnauthorizedError, InvalidTokenError } from '../errors/domain';

/**
 * Decoded JWT payload shape.
 * This is the actual data stored in the token.
 */
export interface TokenPayload extends JwtPayload {
  username: string;
}

/**
 * Authentication result: token + cookie expiration time.
 */
interface AuthResult {
  token: string;
  maxAge: number | undefined;
}

/**
 * Authenticate user with credentials and return JWT token + cookie maxAge.
 * Currently uses static DEV credentials; replace with DB query for production.
 * 
 * The maxAge is derived from the JWT's exp claim (set via expiresIn config).
 * This ensures cookie and token expiration stay synchronized.
 */
const authenticate = (username: string, password: string): AuthResult => {
  if (username === config.DEV_AUTH_USER && password === config.DEV_AUTH_PASS) {
    const payload: TokenPayload = { username };

    // Cast to any only for config values to satisfy SignOptions typing
    // Config is loaded from environment and known to be valid string/number
    const token = jwt.sign(payload, config.JWT_SECRET as Secret, {
      expiresIn: config.JWT_EXPIRES_IN as any
    });

    // Derive maxAge from the JWT's exp claim (source of truth).
    // Decode token to extract exp and calculate remaining milliseconds.
    const decoded = jwt.decode(token) as TokenPayload;
    const maxAge = decoded.exp ? (decoded.exp * 1000 - Date.now()) : undefined;

    return { token, maxAge };
  }

  throw new UnauthorizedError('Invalid credentials');
};

/**
 * Verify JWT token and return decoded payload.
 * Throws 401 for any verification error (expired, invalid sig, malformed, etc).
 */
export const verify = (token: string): TokenPayload => {
  try {
    const payload = jwt.verify(token, config.JWT_SECRET as Secret) as TokenPayload;
    return payload;
  } catch (err: any) {
    // Log error details internally for debugging/metrics, but throw domain error
    const errorType = err.name || 'UnknownJwtError';
    const errorMessage = err.message || 'JWT verification failed';
    
    // In a real app, send this to a logger service for monitoring
    console.warn(`JWT verification failed: ${errorType} - ${errorMessage}`);
    
    throw new InvalidTokenError('Invalid token');
  }
};

export default { authenticate, verify };

