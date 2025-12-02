import authService from '../../src/services/auth.service';
import { UnauthorizedError, InvalidTokenError } from '../../src/errors/domain';

describe('Auth Service (unit - domain rules)', () => {
  it('authenticate succeeds with valid dev creds', () => {
    const res = authService.authenticate('dev', 'dev');
    expect(res.token).toBeDefined();
    expect(res.maxAge).toBeDefined();
  });

  it('authenticate fails with bad creds', () => {
    expect(() => authService.authenticate('x', 'y')).toThrow(UnauthorizedError);
  });

  it('verify throws InvalidTokenError for bad token', () => {
    expect(() => authService.verify('bad.token.here')).toThrow(InvalidTokenError);
  });
});
