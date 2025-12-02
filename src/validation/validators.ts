import { z } from './index';

// Order IDs in this project may be UUIDs or legacy order numbers (strings).
// Accept either a UUID or any non-empty string to be flexible for route params.
export const idSchema = z.union([
  z.string().uuid({ message: 'must be a valid uuid' }),
  z.string().min(1, { message: 'must be a non-empty string' })
]);

export const paginationSchema = z.object({
  page: z
    .preprocess((v) => {
      if (typeof v === 'string') return parseInt(v, 10);
      return v;
    }, z.number().int().min(1).optional()),
  limit: z
    .preprocess((v) => {
      if (typeof v === 'string') return parseInt(v, 10);
      return v;
    }, z.number().int().min(1).max(100).optional()),
}).partial();

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});
