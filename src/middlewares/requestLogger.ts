import { RequestHandler } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';

declare module 'http' {
  // extend Request interface dynamically via module augmentation is not needed here
}

export const requestLogger: RequestHandler = (req, res, next) => {
  const requestId = (req as any).requestId || (crypto as any).randomUUID();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = process.hrtime.bigint();
  logger.info('request.start', { requestId, method: req.method, path: req.originalUrl });

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const elapsedMs = Number(end - start) / 1_000_000;
    logger.info('request.finish', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(elapsedMs)
    });
  });

  next();
};

export default requestLogger;
