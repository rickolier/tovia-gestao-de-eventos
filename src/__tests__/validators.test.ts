import { describe, it, expect } from 'vitest';
import {
  maskCPF, maskCNPJ, maskCPFouCNPJ, maskTelefone, maskCEP,
  validateCPF, validateCNPJ, validateCPFouCNPJ, validateEmail, validateTelefone, validateCEP,
} from '~/utils/validators';

// ── Masks ────────────────────────────────────────────────────────────────────

describe('maskCPF', () => {
  it('formata CPF completo', () => {
    expect(maskCPF('12345678901')).toBe('123.456.789-01');
  });
  it('formata parcial com 6 dígitos', () => {
    expect(maskCPF('123456')).toBe('123.456');
  });
  it('formata parcial com 3 dígitos', () => {
    expect(maskCPF('123')).toBe('123');
  });
  it('remove caracteres não-numéricos', () => {
    expect(maskCPF('123.456.789-01')).toBe('123.456.789-01');
  });
  it('limita a 11 dígitos', () => {
    expect(maskCPF('123456789012345')).toBe('123.456.789-01');
  });
});

describe('maskCNPJ', () => {
  it('formata CNPJ completo', () => {
    expect(maskCNPJ('12345678000195')).toBe('12.345.678/0001-95');
  });
  it('formata parcial com 8 dígitos', () => {
    expect(maskCNPJ('12345678')).toBe('12.345.678');
  });
});

describe('maskCPFouCNPJ', () => {
  it('usa máscara de CPF para até 11 dígitos', () => {
    expect(maskCPFouCNPJ('12345678901')).toBe('123.456.789-01');
  });
  it('usa máscara de CNPJ para mais de 11 dígitos', () => {
    expect(maskCPFouCNPJ('12345678000195')).toBe('12.345.678/0001-95');
  });
});

describe('maskTelefone', () => {
  it('formata celular com 11 dígitos', () => {
    expect(maskTelefone('11999887766')).toBe('(11) 99988-7766');
  });
  it('formata fixo com 10 dígitos', () => {
    expect(maskTelefone('1133445566')).toBe('(11) 3344-5566');
  });
  it('retorna string vazia para input vazio', () => {
    expect(maskTelefone('')).toBe('');
  });
  it('formata parcial com DDD', () => {
    expect(maskTelefone('11')).toBe('(11');
  });
});

describe('maskCEP', () => {
  it('formata CEP completo', () => {
    expect(maskCEP('01001000')).toBe('01001-000');
  });
  it('não formata CEP parcial com 5 ou menos dígitos', () => {
    expect(maskCEP('01001')).toBe('01001');
  });
});

// ── Validators ──────────────────────────────────────────────────────────────

describe('validateCPF', () => {
  it('valida CPF correto', () => {
    expect(validateCPF('529.982.247-25')).toBe(true);
  });
  it('rejeita CPF com dígitos iguais', () => {
    expect(validateCPF('111.111.111-11')).toBe(false);
  });
  it('rejeita CPF com dígito verificador errado', () => {
    expect(validateCPF('529.982.247-26')).toBe(false);
  });
  it('rejeita CPF com tamanho errado', () => {
    expect(validateCPF('123')).toBe(false);
  });
  it('valida CPF sem máscara', () => {
    expect(validateCPF('52998224725')).toBe(true);
  });
});

describe('validateCNPJ', () => {
  it('valida CNPJ correto', () => {
    expect(validateCNPJ('11.222.333/0001-81')).toBe(true);
  });
  it('rejeita CNPJ com dígitos iguais', () => {
    expect(validateCNPJ('11.111.111/1111-11')).toBe(false);
  });
  it('rejeita CNPJ com tamanho errado', () => {
    expect(validateCNPJ('123')).toBe(false);
  });
});

describe('validateCPFouCNPJ', () => {
  it('valida CPF', () => {
    expect(validateCPFouCNPJ('52998224725')).toBe(true);
  });
  it('valida CNPJ', () => {
    expect(validateCPFouCNPJ('11222333000181')).toBe(true);
  });
  it('rejeita tamanho inválido', () => {
    expect(validateCPFouCNPJ('12345')).toBe(false);
  });
});

describe('validateEmail', () => {
  it('valida email correto', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });
  it('rejeita email sem @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });
  it('rejeita email sem domínio', () => {
    expect(validateEmail('user@')).toBe(false);
  });
  it('rejeita email com TLD de 1 char', () => {
    expect(validateEmail('user@example.c')).toBe(false);
  });
  it('aceita email com espaços ao redor', () => {
    expect(validateEmail('  user@example.com  ')).toBe(true);
  });
});

describe('validateTelefone', () => {
  it('valida celular com 11 dígitos', () => {
    expect(validateTelefone('(11) 99988-7766')).toBe(true);
  });
  it('valida fixo com 10 dígitos', () => {
    expect(validateTelefone('(11) 3344-5566')).toBe(true);
  });
  it('rejeita telefone curto', () => {
    expect(validateTelefone('1199')).toBe(false);
  });
});

describe('validateCEP', () => {
  it('valida CEP correto', () => {
    expect(validateCEP('01001-000')).toBe(true);
  });
  it('rejeita CEP com menos de 8 dígitos', () => {
    expect(validateCEP('0100')).toBe(false);
  });
});
