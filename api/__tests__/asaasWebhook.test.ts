import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDb, mockFetch, seedDoc, getDoc, clearStore, createMockReq, createMockRes } from './helpers.js';

vi.mock('../_firebase.js', () => ({ db: mockDb }));
vi.stubGlobal('fetch', mockFetch);

// Set env before importing handler
process.env.ASAAS_WEBHOOK_TOKEN = 'test-token-123';
process.env.RESEND_API_KEY = 'test-resend-key';

const { default: handler } = await import('../asaasWebhook.js');

// ── Helpers ──────────────────────────────────────────────────────────────────

function webhookReq(eventType: string, paymentOverrides: Record<string, any> = {}) {
  return createMockReq({
    method: 'POST',
    headers: { 'asaas-access-token': 'test-token-123' } as any,
    body: {
      event: eventType,
      payment: {
        id: 'pay_xyz',
        value: 49,
        externalReference: 'user1:petach:monthly',
        dueDate: '2026-07-20',
        ...paymentOverrides,
      },
    },
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('asaasWebhook', () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it('rejects non-POST', async () => {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(405);
  });

  it('rejects missing token', async () => {
    const req = createMockReq({ method: 'POST', headers: {} as any, body: {} });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(401);
  });

  it('rejects wrong token', async () => {
    const req = createMockReq({
      method: 'POST',
      headers: { 'asaas-access-token': 'wrong-token' } as any,
      body: {},
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(401);
  });

  it('returns ok when payment is missing', async () => {
    const req = createMockReq({
      method: 'POST',
      headers: { 'asaas-access-token': 'test-token-123' } as any,
      body: { event: 'PAYMENT_CONFIRMED' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
  });

  it('activates plan on PAYMENT_CONFIRMED', async () => {
    seedDoc('users', 'user1', { email: 'user@test.com', nome: 'Test User', plano: null });

    const req = webhookReq('PAYMENT_CONFIRMED');
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    const user = getDoc('users', 'user1');
    expect(user?.plano).toBe('petach');
    expect(user?.planoPendente).toBeNull();
  });

  it('creates notification on plan activation', async () => {
    seedDoc('users', 'user1', { email: 'user@test.com', nome: 'Test' });

    const req = webhookReq('PAYMENT_CONFIRMED');
    const res = createMockRes();
    await handler(req, res);

    const notif = getDoc('notificacoes', 'plan_user1');
    expect(notif).toBeDefined();
    expect(notif?.tipo).toBe('plano_atualizado');
    expect(notif?.mensagem).toContain('Pétach');
  });

  it('sends welcome email for petach plan', async () => {
    seedDoc('users', 'user1', { email: 'user@test.com', nome: 'Test User' });

    const req = webhookReq('PAYMENT_CONFIRMED');
    const res = createMockRes();
    await handler(req, res);

    expect(mockFetch).toHaveBeenCalled();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.to).toContain('user@test.com');
    expect(body.subject).toContain('Pétach');
  });

  it('sends welcome email for koach plan', async () => {
    seedDoc('users', 'user1', { email: 'user@test.com', nome: 'Test' });

    const req = webhookReq('PAYMENT_CONFIRMED', { externalReference: 'user1:koach:monthly' });
    const res = createMockRes();
    await handler(req, res);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.subject).toContain('Koách');
  });

  it('sends welcome email for chalem plan', async () => {
    seedDoc('users', 'user1', { email: 'user@test.com', nome: 'Test' });

    const req = webhookReq('PAYMENT_CONFIRMED', { externalReference: 'user1:chalem:monthly' });
    const res = createMockRes();
    await handler(req, res);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.subject).toContain('Chalém');
  });

  it('cancels plan on PAYMENT_OVERDUE', async () => {
    seedDoc('users', 'user1', { email: 'user@test.com', nome: 'Test', plano: 'petach' });

    const req = webhookReq('PAYMENT_OVERDUE');
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    const user = getDoc('users', 'user1');
    expect(user?.plano).toBeNull();
    expect(user?.asaasSubscriptionId).toBeNull();
  });

  it('sends overdue email on PAYMENT_OVERDUE', async () => {
    seedDoc('users', 'user1', { email: 'user@test.com', nome: 'Test', plano: 'petach' });

    const req = webhookReq('PAYMENT_OVERDUE');
    const res = createMockRes();
    await handler(req, res);

    expect(mockFetch).toHaveBeenCalled();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.subject).toContain('pagamento pendente');
  });

  it('cancels plan on SUBSCRIPTION_INACTIVATED', async () => {
    seedDoc('users', 'user1', { email: 'user@test.com', nome: 'Test', plano: 'koach' });

    const req = webhookReq('SUBSCRIPTION_INACTIVATED', { externalReference: 'user1:koach:monthly' });
    const res = createMockRes();
    await handler(req, res);

    const user = getDoc('users', 'user1');
    expect(user?.plano).toBeNull();
  });

  it('handles missing userId gracefully', async () => {
    const req = webhookReq('PAYMENT_CONFIRMED', { externalReference: '' });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body).toBe('ok');
  });

  it('handles missing planLevel on paid event gracefully', async () => {
    seedDoc('users', 'user1', { email: 'user@test.com', nome: 'Test' });

    const req = webhookReq('PAYMENT_CONFIRMED', { externalReference: 'user1' });
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toBe('ok');
  });
});
