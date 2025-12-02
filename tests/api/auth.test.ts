import { http } from '../../tests/helpers/testApp';
import { resetDb, disconnectDb } from '../../tests/helpers/db';
import config from '../../src/config';

beforeAll(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
  await disconnectDb();
});

describe('API /auth (integration)', () => {
  it('login success', async () => {
    const res = await http().post('/auth/login').send({ username: config.DEV_AUTH_USER, password: config.DEV_AUTH_PASS });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('login failure', async () => {
    const res = await http().post('/auth/login').send({ username: 'x', password: 'y' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('AUTH_ERROR');
  });
});

it('login without body returns 400', async () => {
  const res = await http().post('/auth/login').send({});
  expect(res.status).toBe(400);
  expect(res.body.error).toBeDefined();
});

it('login without password returns 400', async () => {
  const res = await http().post('/auth/login').send({ username: config.DEV_AUTH_USER });
  expect(res.status).toBe(400);
  expect(res.body.error).toBeDefined();
});

it('login returns a valid JWT-like token', async () => {
  const res = await http().post('/auth/login').send({
    username: config.DEV_AUTH_USER,
    password: config.DEV_AUTH_PASS
  });

  expect(res.status).toBe(200);
  expect(res.body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
});

