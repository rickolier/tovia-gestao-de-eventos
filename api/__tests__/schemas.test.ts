import { describe, it, expect } from 'vitest';
import { checkoutSchema, saveGatewayConfigSchema, createEventChargeSchema, sendEmailSchema } from '../_schemas';

describe('checkoutSchema', () => {
  const valid = {
    planLevel: 'petach',
    period: 'monthly',
    paymentMethod: 'credit_card',
    userId: 'uid123',
    userEmail: 'test@example.com',
  };

  it('aceita payload válido', () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });

  it('rejeita plano inexistente', () => {
    const result = checkoutSchema.safeParse({ ...valid, planLevel: 'platinum' });
    expect(result.success).toBe(false);
  });

  it('rejeita plano chinam (gratuito não passa por checkout)', () => {
    const result = checkoutSchema.safeParse({ ...valid, planLevel: 'chinam' });
    expect(result.success).toBe(false);
  });

  it('aceita todos os planos pagos', () => {
    for (const plan of ['petach', 'koach', 'chalem']) {
      expect(checkoutSchema.safeParse({ ...valid, planLevel: plan }).success).toBe(true);
    }
  });

  it('rejeita email inválido', () => {
    const result = checkoutSchema.safeParse({ ...valid, userEmail: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejeita userId vazio', () => {
    const result = checkoutSchema.safeParse({ ...valid, userId: '' });
    expect(result.success).toBe(false);
  });

  it('default period é monthly', () => {
    const { period, ...rest } = valid;
    const result = checkoutSchema.safeParse(rest);
    expect(result.success).toBe(true);
    expect(result.data?.period).toBe('monthly');
  });
});

describe('saveGatewayConfigSchema', () => {
  it('aceita config Asaas válida', () => {
    const result = saveGatewayConfigSchema.safeParse({
      gatewayType: 'asaas',
      apiKey: '$aact_test_key',
      sandbox: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejeita gateway desconhecido', () => {
    const result = saveGatewayConfigSchema.safeParse({
      gatewayType: 'stripe',
      apiKey: 'sk_test',
      sandbox: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejeita apiKey vazia', () => {
    const result = saveGatewayConfigSchema.safeParse({
      gatewayType: 'asaas',
      apiKey: '',
      sandbox: true,
    });
    expect(result.success).toBe(false);
  });
});

describe('createEventChargeSchema', () => {
  const valid = {
    eventoId: 'evt1',
    inscricaoId: 'ins1',
    paymentMethod: 'pix',
    attendeeName: 'João',
    attendeeEmail: 'joao@test.com',
    valor: 50,
  };

  it('aceita payload válido', () => {
    expect(createEventChargeSchema.safeParse(valid).success).toBe(true);
  });

  it('rejeita valor zero', () => {
    const result = createEventChargeSchema.safeParse({ ...valid, valor: 0 });
    expect(result.success).toBe(false);
  });

  it('rejeita valor negativo', () => {
    const result = createEventChargeSchema.safeParse({ ...valid, valor: -10 });
    expect(result.success).toBe(false);
  });

  it('aceita creditCard opcional', () => {
    const result = createEventChargeSchema.safeParse({
      ...valid,
      paymentMethod: 'credit_card',
      creditCard: {
        holderName: 'João Silva',
        number: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '2027',
        ccv: '123',
      },
    });
    expect(result.success).toBe(true);
  });
});

describe('sendEmailSchema', () => {
  it('aceita email único', () => {
    const result = sendEmailSchema.safeParse({
      to: 'test@example.com',
      subject: 'Assunto',
      html: '<p>Corpo</p>',
    });
    expect(result.success).toBe(true);
  });

  it('aceita array de emails', () => {
    const result = sendEmailSchema.safeParse({
      to: ['a@test.com', 'b@test.com'],
      subject: 'Assunto',
      html: '<p>Corpo</p>',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita subject vazio', () => {
    const result = sendEmailSchema.safeParse({
      to: 'test@example.com',
      subject: '',
      html: '<p>Corpo</p>',
    });
    expect(result.success).toBe(false);
  });
});
