import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHash } from 'crypto';
import { mockDb, mockFetch, seedDoc, getDoc, clearStore, createMockReq, createMockRes } from './helpers.js';

// Mock modules before importing the handler
vi.mock('../_firebase.js', () => ({ db: mockDb }));
vi.stubGlobal('fetch', mockFetch);
process.env.RESEND_API_KEY = 'test-resend-key';

const { default: handler } = await import('../eventPaymentWebhook.js');

// ── Helpers ──────────────────────────────────────────────────────────────────

const WEBHOOK_TOKEN = 'test-webhook-secret-token';
const TOKEN_HASH = createHash('sha256').update(WEBHOOK_TOKEN).digest('hex');

function webhookReq(eventType: string, paymentOverrides: Record<string, any> = {}) {
  return createMockReq({
    method: 'POST',
    headers: { 'asaas-access-token': WEBHOOK_TOKEN } as any,
    body: {
      event: eventType,
      payment: {
        id: 'pay_abc123',
        value: 100,
        billingType: 'PIX',
        paymentDate: '2026-07-20',
        externalReference: 'event:evt1:insc1',
        dueDate: '2026-07-20',
        ...paymentOverrides,
      },
    },
  });
}

function seedEventWithToken(eventoId = 'evt1', organizerId = 'org1') {
  seedDoc('eventos', eventoId, { criado_por: organizerId, nome: 'Evento Teste' });
  seedDoc('organizer_public', organizerId, { webhook_token_hash: TOKEN_HASH });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('eventPaymentWebhook', () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it('rejects non-POST methods', async () => {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(405);
  });

  it('returns ok when payment is missing', async () => {
    const req = createMockReq({ body: { event: 'PAYMENT_CONFIRMED' } });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
  });

  it('ignores non-event external references', async () => {
    const req = createMockReq({
      body: {
        event: 'PAYMENT_CONFIRMED',
        payment: { externalReference: 'user123:petach:monthly', value: 49 },
      },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body).toBe('ok');
  });

  it('rejects when webhook_token_hash is missing', async () => {
    seedDoc('eventos', 'evt1', { criado_por: 'org1' });
    seedDoc('organizer_public', 'org1', {}); // no token hash
    const req = webhookReq('PAYMENT_CONFIRMED');
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(401);
  });

  it('rejects mismatched webhook token', async () => {
    seedEventWithToken();
    const req = webhookReq('PAYMENT_CONFIRMED');
    (req.headers as any)['asaas-access-token'] = 'wrong-token';
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(401);
  });

  it('marks inscription as paid on PAYMENT_CONFIRMED', async () => {
    seedEventWithToken();
    seedDoc('eventos/evt1/inscricoes', 'insc1', {
      nome: 'João',
      email: 'joao@test.com',
      status: 'pagamento_iniciado',
    });

    const req = webhookReq('PAYMENT_CONFIRMED');
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    const inscricao = getDoc('eventos/evt1/inscricoes', 'insc1');
    expect(inscricao?.status).toBe('pago');
    expect(inscricao?.valor_pago).toBe(100);
    expect(inscricao?.validada_manual).toBe(true);
  });

  it('registers automatic payment record', async () => {
    seedEventWithToken();
    seedDoc('eventos/evt1/inscricoes', 'insc1', {
      nome: 'João',
      email: 'joao@test.com',
      status: 'pagamento_iniciado',
    });

    const req = webhookReq('PAYMENT_CONFIRMED');
    const res = createMockRes();
    await handler(req, res);

    const pagamento = getDoc('eventos/evt1/pagamentos', 'auto_insc1');
    expect(pagamento).toBeDefined();
    expect(pagamento?.valor).toBe(100);
    expect(pagamento?.status).toBe('pago');
    expect(pagamento?.metodo).toBe('pix');
    expect(pagamento?.origem).toBe('automatico');
  });

  it('sends confirmation email on payment', async () => {
    seedEventWithToken();
    seedDoc('eventos/evt1/inscricoes', 'insc1', {
      nome: 'João',
      email: 'joao@test.com',
      status: 'pagamento_iniciado',
    });

    const req = webhookReq('PAYMENT_CONFIRMED');
    const res = createMockRes();
    await handler(req, res);

    expect(mockFetch).toHaveBeenCalled();
    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe('https://api.resend.com/emails');
    const body = JSON.parse(fetchCall[1].body);
    expect(body.to).toContain('joao@test.com');
    expect(body.subject).toContain('Inscrição confirmada');
  });

  it('handles donations (fallback collection)', async () => {
    seedEventWithToken();
    // No inscription — handler falls back to doacoes collection
    seedDoc('eventos/evt1/doacoes', 'insc1', {
      doadorNome: 'Maria',
      email: 'maria@test.com',
      status: 'pendente',
    });

    const req = webhookReq('PAYMENT_RECEIVED');
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    const doacao = getDoc('eventos/evt1/doacoes', 'insc1');
    expect(doacao?.status).toBe('aprovada');
    expect(doacao?.formaPagamento).toBe('pix');
  });

  it('cancels inscription on PAYMENT_OVERDUE', async () => {
    seedEventWithToken();
    seedDoc('eventos/evt1/inscricoes', 'insc1', {
      nome: 'João',
      email: 'joao@test.com',
      status: 'pagamento_iniciado',
    });

    const req = webhookReq('PAYMENT_OVERDUE');
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    const inscricao = getDoc('eventos/evt1/inscricoes', 'insc1');
    expect(inscricao?.status).toBe('cancelada');
  });

  it('maps billing types correctly', async () => {
    seedEventWithToken();
    seedDoc('eventos/evt1/inscricoes', 'insc1', {
      nome: 'Test',
      email: 'test@test.com',
      status: 'pagamento_iniciado',
    });

    const req = webhookReq('PAYMENT_CONFIRMED', { billingType: 'CREDIT_CARD' });
    const res = createMockRes();
    await handler(req, res);

    const pagamento = getDoc('eventos/evt1/pagamentos', 'auto_insc1');
    expect(pagamento?.metodo).toBe('cartao');
  });

  it('uses custom email template when configured', async () => {
    seedEventWithToken();
    seedDoc('eventos', 'evt1', {
      criado_por: 'org1',
      nome: 'Evento Teste',
      config_comunicacao: {
        email_confirmacao: {
          ativo: true,
          assunto: 'Parabéns {nome}!',
          corpo: 'Olá {nome}, você está inscrito no {evento}.',
        },
      },
    });
    seedDoc('eventos/evt1/inscricoes', 'insc1', {
      nome: 'João',
      email: 'joao@test.com',
      status: 'pagamento_iniciado',
    });

    const req = webhookReq('PAYMENT_CONFIRMED');
    const res = createMockRes();
    await handler(req, res);

    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.subject).toBe('Parabéns João!');
    expect(body.html).toContain('você está inscrito no Evento Teste');
  });
});
