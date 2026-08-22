import { describe, it, expect, vi } from 'vitest';
import { createPaymentProvider } from '../_payments/factory';
import type { GatewayType } from '../_payments/types';

vi.mock('../_gateway-utils.js', () => ({
  createOrFindAsaasCustomer: vi.fn().mockResolvedValue('cus_test123'),
  createAsaasCharge: vi.fn().mockResolvedValue({
    id: 'pay_test',
    invoiceUrl: 'https://pay.test/inv',
    status: 'PENDING',
  }),
  createAsaasSubscription: vi.fn().mockResolvedValue({ id: 'sub_test', status: 'ACTIVE' }),
  registerAsaasWebhook: vi.fn().mockResolvedValue(undefined),
  asaasBaseUrl: vi.fn().mockReturnValue('https://sandbox.asaas.com/api/v3'),
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { data: [] } }),
    post: vi.fn(),
    isAxiosError: vi.fn().mockReturnValue(false),
  },
}));

describe('createPaymentProvider factory', () => {
  it('retorna AsaasAdapter para type "asaas"', () => {
    const provider = createPaymentProvider('asaas', 'key', true);
    expect(provider).toBeDefined();
    expect(provider.supportedMethods).toBeDefined();
  });

  it('lança erro para gateway não suportado', () => {
    expect(() => createPaymentProvider('stripe' as GatewayType, 'key', true))
      .toThrow('Gateway "stripe" não suportado.');
  });

  it('lança erro para gateway inventado', () => {
    expect(() => createPaymentProvider('paypal' as GatewayType, 'key', true))
      .toThrow('não suportado');
  });
});

describe('AsaasAdapter', () => {
  const adapter = createPaymentProvider('asaas', 'test_key', true);

  describe('supportedMethods', () => {
    it('retorna 7 métodos de pagamento', () => {
      const methods = adapter.supportedMethods();
      expect(methods).toHaveLength(7);
    });

    it('inclui pix, boleto e credit_card', () => {
      const methods = adapter.supportedMethods();
      expect(methods).toContain('pix');
      expect(methods).toContain('boleto');
      expect(methods).toContain('credit_card');
    });

    it('inclui métodos com parcelamento', () => {
      const methods = adapter.supportedMethods();
      expect(methods).toContain('boleto_installment');
      expect(methods).toContain('credit_card_installment');
      expect(methods).toContain('credit_card_subscription');
    });

    it('inclui débito', () => {
      const methods = adapter.supportedMethods();
      expect(methods).toContain('debit_card');
    });
  });

  describe('createCustomer', () => {
    it('cria cliente e retorna id', async () => {
      const result = await adapter.createCustomer({
        name: 'João',
        email: 'joao@test.com',
        externalRef: 'uid_123',
      });
      expect(result.id).toBe('cus_test123');
    });
  });

  describe('createCharge', () => {
    it('cria cobrança e retorna ChargeResult', async () => {
      const result = await adapter.createCharge({
        customerId: 'cus_test',
        value: 50,
        dueDate: '2026-09-01',
        description: 'Ingresso teste',
        paymentMethod: 'pix',
        externalRef: 'ref_123',
      });
      expect(result.id).toBe('pay_test');
      expect(result.invoiceUrl).toBe('https://pay.test/inv');
      expect(result.status).toBe('PENDING');
    });
  });

  describe('parseWebhookEvent', () => {
    it('parseia PAYMENT_CONFIRMED corretamente', () => {
      const event = adapter.parseWebhookEvent({}, {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_123',
          externalReference: 'ref_456',
          value: 100,
          billingType: 'PIX',
          paymentDate: '2026-08-21',
        },
      });
      expect(event).not.toBeNull();
      expect(event!.type).toBe('payment_confirmed');
      expect(event!.paymentId).toBe('pay_123');
      expect(event!.paymentMethod).toBe('pix');
      expect(event!.value).toBe(100);
    });

    it('parseia PAYMENT_RECEIVED como payment_confirmed', () => {
      const event = adapter.parseWebhookEvent({}, {
        event: 'PAYMENT_RECEIVED',
        payment: { id: 'pay_1', externalReference: 'r', value: 10, billingType: 'CREDIT_CARD' },
      });
      expect(event!.type).toBe('payment_confirmed');
      expect(event!.paymentMethod).toBe('credit_card');
    });

    it('parseia PAYMENT_OVERDUE', () => {
      const event = adapter.parseWebhookEvent({}, {
        event: 'PAYMENT_OVERDUE',
        payment: { id: 'pay_2', externalReference: 'r', value: 50, billingType: 'BOLETO' },
      });
      expect(event!.type).toBe('payment_overdue');
      expect(event!.paymentMethod).toBe('boleto');
    });

    it('retorna null para evento desconhecido', () => {
      const event = adapter.parseWebhookEvent({}, {
        event: 'UNKNOWN_EVENT',
        payment: { id: 'pay_3', externalReference: 'r', value: 0, billingType: 'PIX' },
      });
      expect(event).toBeNull();
    });

    it('retorna null para body sem event', () => {
      const event = adapter.parseWebhookEvent({}, { payment: {} });
      expect(event).toBeNull();
    });

    it('retorna null para body sem payment', () => {
      const event = adapter.parseWebhookEvent({}, { event: 'PAYMENT_CONFIRMED' });
      expect(event).toBeNull();
    });
  });
});
