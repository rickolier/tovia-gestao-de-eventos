import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDb, mockVerifyAuth, seedDoc, getDoc, clearStore, createMockReq, createMockRes } from './helpers.js';

// Mock axios
const mockAxiosPost = vi.fn();
const mockAxiosGet = vi.fn();
const mockAxiosPut = vi.fn();
vi.mock('axios', () => ({
  default: {
    post: (...args: any[]) => mockAxiosPost(...args),
    get: (...args: any[]) => mockAxiosGet(...args),
    put: (...args: any[]) => mockAxiosPut(...args),
  },
}));

vi.mock('../_firebase.js', () => ({
  db: mockDb,
  verifyAuth: (...args: any[]) => mockVerifyAuth(...args),
}));

const { default: handler } = await import('../createCheckout.js');

// ── Helpers ──────────────────────────────────────────────────────────────────

function checkoutReq(overrides: Record<string, any> = {}) {
  return createMockReq({
    method: 'POST',
    headers: { authorization: 'Bearer user1' } as any,
    body: {
      planLevel: 'petach',
      period: 'monthly',
      paymentMethod: 'credit_card',
      userId: 'user1',
      userName: 'Test User',
      userEmail: 'test@test.com',
      userCpfCnpj: '12345678901',
      ...overrides,
    },
  });
}

function setupAsaasMocks() {
  // Customer creation
  mockAxiosPost.mockImplementation(async (url: string, data: any) => {
    if (url.includes('/customers')) {
      return { data: { id: 'cus_123' } };
    }
    if (url.includes('/subscriptions')) {
      return { data: { id: 'sub_123' } };
    }
    if (url.includes('/payments')) {
      return { data: { id: 'pay_123', invoiceUrl: 'https://asaas.com/pay/123', status: 'PENDING' } };
    }
    return { data: {} };
  });

  mockAxiosGet.mockImplementation(async (url: string) => {
    if (url.includes('/subscriptions/') && url.includes('/payments')) {
      return { data: { data: [{ invoiceUrl: 'https://asaas.com/invoice/123' }] } };
    }
    if (url.includes('/customers')) {
      return { data: { data: [] } };
    }
    return { data: {} };
  });

  mockAxiosPut.mockResolvedValue({ data: {} });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('createCheckout', () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
    setupAsaasMocks();
    // Seed billing config
    seedDoc('config', 'billing', { asaas_api_key: 'test-key', sandbox: true });
    // Seed user
    seedDoc('users', 'user1', { email: 'test@test.com', nome: 'Test User' });
  });

  it('rejects non-POST', async () => {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(405);
  });

  it('rejects missing required fields', async () => {
    const req = checkoutReq({ planLevel: undefined, userId: undefined, userEmail: undefined });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body?.error).toBeDefined();
  });

  it('rejects invalid plan level', async () => {
    const req = checkoutReq({ planLevel: 'chinam' });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body?.error).toContain('Plano inválido');
  });

  it('rejects invalid period', async () => {
    const req = checkoutReq({ period: 'weekly' });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body?.error).toBeDefined();
  });

  it('rejects unauthenticated requests', async () => {
    mockVerifyAuth.mockRejectedValueOnce(Object.assign(new Error('Não autenticado.'), { status: 401 }));
    const req = checkoutReq();
    (req.headers as any).authorization = '';
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(401);
  });

  it('rejects UID mismatch', async () => {
    mockVerifyAuth.mockRejectedValueOnce(Object.assign(new Error('UID mismatch.'), { status: 403 }));
    const req = checkoutReq();
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(403);
  });

  it('creates monthly subscription and returns payment URL', async () => {
    const req = checkoutReq({ period: 'monthly' });
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body?.paymentUrl).toBe('https://asaas.com/invoice/123');
    expect(res._body?.subscriptionId).toBe('sub_123');

    // Verify user was updated
    const user = getDoc('users', 'user1');
    expect(user?.asaasSubscriptionId).toBe('sub_123');
    expect(user?.planoPendente).toBe('petach');
    expect(user?.subscriptionPeriod).toBe('monthly');
  });

  it('creates annual payment with PIX', async () => {
    const req = checkoutReq({ period: 'annual', paymentMethod: 'pix', planLevel: 'koach' });
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body?.paymentUrl).toBe('https://asaas.com/pay/123');

    // Verify subscription was called with PIX billingType
    const paymentCall = mockAxiosPost.mock.calls.find((c: any[]) => c[0].includes('/payments'));
    expect(paymentCall).toBeDefined();
    expect(paymentCall[1].billingType).toBe('PIX');
  });

  it('creates annual payment with credit card (12x installments)', async () => {
    const req = checkoutReq({ period: 'annual', paymentMethod: 'credit_card', planLevel: 'petach' });
    const res = createMockRes();
    await handler(req, res);

    const paymentCall = mockAxiosPost.mock.calls.find((c: any[]) => c[0].includes('/payments'));
    expect(paymentCall[1].billingType).toBe('CREDIT_CARD');
    expect(paymentCall[1].installmentCount).toBe(12);
    expect(paymentCall[1].value).toBe(50);
  });

  it('reuses existing Asaas customer ID', async () => {
    seedDoc('users', 'user1', { email: 'test@test.com', asaasCustomerId: 'cus_existing' });

    const req = checkoutReq();
    const res = createMockRes();
    await handler(req, res);

    // Should have called PUT to update, not POST to create
    expect(mockAxiosPut).toHaveBeenCalled();
    const putCall = mockAxiosPut.mock.calls[0];
    expect(putCall[0]).toContain('cus_existing');
  });

  it('returns 500 when billing config is missing', async () => {
    clearStore();
    seedDoc('users', 'user1', { email: 'test@test.com' });
    // No billing config and no env var
    delete process.env.ASAAS_API_KEY;

    const req = checkoutReq();
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._body?.error).toContain('Configuração de pagamento');
  });

  it('enforces rate limit', async () => {
    // Seed rate limit data with 3 recent requests
    const now = Date.now();
    seedDoc('_rate_limits', 'checkout_user1', {
      requests: [now - 1000, now - 2000, now - 3000],
    });

    const req = checkoutReq();
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(429);
    expect(res._body?.error).toContain('Muitas tentativas');
  });
});
