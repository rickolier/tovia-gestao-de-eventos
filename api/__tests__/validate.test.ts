import { describe, it, expect, vi } from 'vitest';
import { validateBody } from '../_validate';
import { z } from 'zod';

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('validateBody', () => {
  const schema = z.object({
    name: z.string().min(1, 'Nome obrigatório.'),
    age: z.number().int().positive('Idade deve ser positiva.'),
  });

  it('retorna dados parseados para input válido', () => {
    const res = mockRes();
    const result = validateBody({ name: 'João', age: 25 }, res, schema);
    expect(result).toEqual({ name: 'João', age: 25 });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('retorna null e 400 para input inválido', () => {
    const res = mockRes();
    const result = validateBody({ name: '', age: -1 }, res, schema);
    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Nome obrigatório.' });
  });

  it('retorna null e 400 para input undefined', () => {
    const res = mockRes();
    const result = validateBody(undefined, res, schema);
    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('retorna primeira mensagem de erro', () => {
    const res = mockRes();
    validateBody({}, res, schema);
    const errorMsg = res.json.mock.calls[0][0].error;
    expect(typeof errorMsg).toBe('string');
    expect(errorMsg.length).toBeGreaterThan(0);
  });
});
