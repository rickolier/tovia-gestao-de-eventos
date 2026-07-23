import type { VercelResponse } from '@vercel/node';
import type { ZodType } from 'zod';

export function validateBody<T>(body: unknown, res: VercelResponse, schema: ZodType<T>): T | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message || 'Dados inválidos.';
    res.status(400).json({ error: firstError });
    return null;
  }
  return result.data;
}
