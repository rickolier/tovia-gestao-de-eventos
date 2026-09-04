import { describe, it, expect } from 'vitest';
import { gerarCodigoProdutor, gerarCodigoEvento, gerarCodigoPagina } from '~/utils/codigos';

describe('gerarCodigoProdutor', () => {
  it('gera código com 6 caracteres', () => {
    expect(gerarCodigoProdutor()).toHaveLength(6);
  });

  it('gera códigos únicos', () => {
    const codes = new Set(Array.from({ length: 50 }, () => gerarCodigoProdutor()));
    expect(codes.size).toBe(50);
  });

  it('gera apenas caracteres URL-safe', () => {
    const code = gerarCodigoProdutor();
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('gerarCodigoEvento', () => {
  it('gera código com 10 caracteres', () => {
    expect(gerarCodigoEvento()).toHaveLength(10);
  });

  it('gera códigos únicos', () => {
    const codes = new Set(Array.from({ length: 50 }, () => gerarCodigoEvento()));
    expect(codes.size).toBe(50);
  });
});

describe('gerarCodigoPagina', () => {
  it('gera código com 8 caracteres', () => {
    expect(gerarCodigoPagina()).toHaveLength(8);
  });

  it('gera códigos únicos', () => {
    const codes = new Set(Array.from({ length: 50 }, () => gerarCodigoPagina()));
    expect(codes.size).toBe(50);
  });
});
