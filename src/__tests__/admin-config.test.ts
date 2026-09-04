import { describe, it, expect } from 'vitest';
import { ADMIN_EMAILS, isAdminEmail, getTestPlan, isDemoEmail } from '~/utils/admin-config';

describe('ADMIN_EMAILS', () => {
  it('contém os emails admin', () => {
    expect(ADMIN_EMAILS).toContain('admin@toviaapp.com.br');
    expect(ADMIN_EMAILS).toContain('suporte@toviaapp.com.br');
  });
});

describe('isAdminEmail', () => {
  it('retorna true para emails admin', () => {
    expect(isAdminEmail('admin@toviaapp.com.br')).toBe(true);
    expect(isAdminEmail('suporte@toviaapp.com.br')).toBe(true);
  });

  it('retorna false para emails não-admin', () => {
    expect(isAdminEmail('user@gmail.com')).toBe(false);
  });

  it('retorna false para null/undefined', () => {
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });

  it('retorna false para string vazia', () => {
    expect(isAdminEmail('')).toBe(false);
  });
});

describe('getTestPlan', () => {
  it('retorna plano para conta de teste', () => {
    expect(getTestPlan('testepro@toviaapp.com.br')).toBe('chalem');
  });

  it('retorna null para email normal', () => {
    expect(getTestPlan('user@gmail.com')).toBeNull();
  });

  it('retorna null para null/undefined', () => {
    expect(getTestPlan(null)).toBeNull();
    expect(getTestPlan(undefined)).toBeNull();
  });
});

describe('isDemoEmail', () => {
  it('retorna true para conta de teste', () => {
    expect(isDemoEmail('testepro@toviaapp.com.br')).toBe(true);
  });

  it('retorna false para email normal', () => {
    expect(isDemoEmail('user@gmail.com')).toBe(false);
  });

  it('retorna false para null/undefined', () => {
    expect(isDemoEmail(null)).toBe(false);
    expect(isDemoEmail(undefined)).toBe(false);
  });
});
