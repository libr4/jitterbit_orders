import { RequestHandler } from 'express';
import { ZodTypeAny, AnyZodObject, z } from 'zod';
import { InvalidInputError } from '../errors/domain';

type SchemaParts = {
  body?: ZodTypeAny | AnyZodObject;
  params?: ZodTypeAny | AnyZodObject;
  query?: ZodTypeAny | AnyZodObject;
};

export function validateSchema(schemas: SchemaParts): RequestHandler {
  return (req, _res, next) => {
    try {
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        req.params = parsed as any;
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        req.query = parsed as any;
      }
      if (schemas.body) {
        const parsed = schemas.body.parse(req.body);
        req.body = parsed as any;
      }
      return next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const message = err.errors.map(e => `${e.path.join('.')} ${e.message}`).join('; ');
        return next(new InvalidInputError(message || 'Invalid request payload'));
      }
      return next(err);
    }
  };
}

export function validateBody(schema: ZodTypeAny | AnyZodObject) {
  return validateSchema({ body: schema });
}

export function validateParams(schema: ZodTypeAny | AnyZodObject) {
  return validateSchema({ params: schema });
}

export function validateQuery(schema: ZodTypeAny | AnyZodObject) {
  return validateSchema({ query: schema });
}
