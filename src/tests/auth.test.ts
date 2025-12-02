import request from 'supertest';
import app from '../app';
import config from '../config';

describe('Auth', () => {
  it('login success', async () => {
    const res = await request(app).post('/auth/login').send({ username: config.DEV_AUTH_USER, password: config.DEV_AUTH_PASS });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('login failure', async () => {
    const res = await request(app).post('/auth/login').send({ username: 'x', password: 'y' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('AUTH_ERROR');
  });
});
