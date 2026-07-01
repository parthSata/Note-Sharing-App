import { z } from 'zod';

export const idSchema = z.string().min(1);

export function parseJsonBody<T>(schema: z.ZodType<T>, body: unknown) {
  return schema.parse(body);
}