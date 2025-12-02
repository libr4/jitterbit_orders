import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import createError from 'http-errors';

const validate = (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err: any) {
    const message = err.errors ? err.errors.map((e: any) => e.message).join(', ') : 'Invalid payload';
    next(createError(400, 'Validation failed', { code: 'VALIDATION_ERROR', details: message }));
  }
};

export default validate;
