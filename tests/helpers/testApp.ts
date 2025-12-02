import app from '../../src/app';
import request from 'supertest';

export function getApp() {
  return app;
}

export function http() {
  return request(app);
}
