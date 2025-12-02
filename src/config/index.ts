import dotenv from 'dotenv';
dotenv.config();

export default {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  HOST: process.env.HOST || '127.0.0.1',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://dev:dev@localhost:5432/orders_dev',
  JWT_SECRET: process.env.JWT_SECRET || 'change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  DEV_AUTH_USER: process.env.DEV_AUTH_USER || 'dev',
  DEV_AUTH_PASS: process.env.DEV_AUTH_PASS || 'dev'
};
