import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import { db } from './_firebase.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'Tovia <noreply@toviaapp.com.br>';

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

function wrapCustomEmail(corpo: string): string {
  const PRIMARY = '#FF6B1A';
  const TEXT = '#1a1a1a';
  const html = corpo
    .split('\n')
    .map(line => line.trim()
      ? `<p style="margin:0 0 16px;color:${TEXT};font-size:15px;line-height:1.6;">${line}</p>`
      : '')
    .join('');
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;background:#f5f3f0;margin:0;padding:40px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:${PRIMARY};border-radius:16px 16px 0 0;padding:24px 40px;text-align:center;">
          <span style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-1px;">tovia</span>
        </td></tr>
        <tr><td style="background:#fff;padding:32px 40px;border-radius:0 0 16px 16px;">${html}</td></tr>
        <tr><td style="padding:24px 0;text-align:center;">
          <span style="font-size:12px;color:#9ca3af;">Este é um e-mail automático, por favor não responda.</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
  } catch (e) {
    console.warn('Email send failed:', e);
  }
}

function mapBillingType(billingType: string): string {
  const map: Record<string, string> = {
    PIX: 'pix',
    BOLETO: 'boleto',
    CREDIT_CARD: 'cartao',
    DEBIT_CARD: 'cartao',
  };
  return map[billingType] ?? 'pix';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const event = req.body;
  const eventType: string = event?.event;
  const payment = event?.payment;

  if (!payment) return res.status(200).send('ok');

  const externalRef: string = payment.externalReference || '';

  // Este webhook trata apenas cobranças de eventos (prefixo "event:")
  if (!externalRef.startsWith('event:')) return res.status(200).send('ok');

  const parts = externalRef.split(':');
  const eventoId = parts[1];
  const inscricaoId = parts[2];

  if (!eventoId || !inscricaoId) return res.status(200).send('ok');

  // Valida token do Asaas via SHA256 — obrigatório, sem bypass por exceção
  const eventoDoc = await db.collection('eventos').doc(eventoId).get();
  if (!eventoDoc.exists) return res.status(200).send('ok');
  const organizerId: string = eventoDoc.data()!.criado_por;
  const orgPublicDoc = await db.collection('organizer_public').doc(organizerId).get();
  const storedHash: string = orgPublicDoc.exists ? (orgPublicDoc.data()!.webhook_token_hash ?? '') : '';
  if (!storedHash) {
    console.warn(`[eventPaymentWebhook] evento ${eventoId} sem webhook_token_hash — rejeitado`);
    return res.status(401).send('Unauthorized');
  }
  const incomingToken: string = String(req.headers['asaas-access-token'] ?? '');
  const incomingHash = createHash('sha256').update(incomingToken).digest('hex');
  if (incomingHash !== storedHash) {
    console.warn(`[eventPaymentWebhook] token mismatch para evento ${eventoId}`);
    return res.status(401).send('Unauthorized');
  }

  const paidEvents = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'];
  const canceledEvents = ['PAYMENT_OVERDUE', 'PAYMENT_DELETED', 'PAYMENT_REFUNDED'];

  try {
    let inscricaoRef = db.collection(`eventos/${eventoId}/inscricoes`).doc(inscricaoId);
    let inscricaoDoc = await inscricaoRef.get();
    let isDonation = false;

    if (!inscricaoDoc.exists) {
      // Fallback: pode ser uma doação
      inscricaoRef = db.collection(`eventos/${eventoId}/doacoes`).doc(inscricaoId);
      inscricaoDoc = await inscricaoRef.get();
      isDonation = true;
      if (!inscricaoDoc.exists) return res.status(200).send('ok');
    }

    const inscricao = inscricaoDoc.data()!;

    if (paidEvents.includes(eventType)) {
      const dataPagamento = payment.paymentDate
        ? new Date(payment.paymentDate).toISOString()
        : new Date().toISOString();

      if (isDonation) {
        await inscricaoRef.update({
          status: 'aprovada',
          valor_pago: payment.value,
          data_pagamento: dataPagamento,
          formaPagamento: mapBillingType(payment.billingType),
        });
      } else {
        await inscricaoRef.update({
          status: 'pago',
          valor_pago: payment.value,
          data_pagamento: dataPagamento,
          validada_manual: true,
        });
      }

      // Registra o pagamento automático
      const pagamentoId = `auto_${inscricaoId}`;
      await db.collection(`eventos/${eventoId}/pagamentos`).doc(pagamentoId).set({
        id: pagamentoId,
        inscricaoId,
        eventoId,
        valor: payment.value,
        status: 'pago',
        metodo: mapBillingType(payment.billingType),
        data_vencimento: payment.dueDate ?? dataPagamento,
        data_pagamento: dataPagamento,
        origem: 'automatico',
        gateway_payment_id: payment.id,
      });

      // E-mail de confirmação (não envia para doações — comunicação fica com o organizador)
      const recipientName = isDonation ? (inscricao.doadorNome ?? '') : (inscricao.nome ?? '');
      if (!isDonation && inscricao.email) {
        const evDoc = await db.collection('eventos').doc(eventoId).get();
        const evData = evDoc.exists ? evDoc.data()! : {};
        const eventoNome: string = evData.nome ?? 'evento';
        const cfgEmail = !isDonation ? evData.config_comunicacao?.email_confirmacao : null;

        let subject: string;
        let body: string;

        if (cfgEmail?.ativo && cfgEmail.corpo) {
          const vars: Record<string, string> = {
            nome: recipientName,
            evento: eventoNome,
            data: evData.data_inicio ? new Date(evData.data_inicio).toLocaleDateString('pt-BR') : '',
            local: evData.local ?? '',
          };
          subject = interpolate(cfgEmail.assunto || `Inscrição confirmada — ${eventoNome}`, vars);
          body = wrapCustomEmail(interpolate(cfgEmail.corpo, vars));
        } else {
          subject = isDonation
            ? `Doação confirmada — ${eventoNome} ✅`
            : `Inscrição confirmada — ${eventoNome} ✅`;
          body = isDonation
            ? `<p>Olá, <strong>${recipientName}</strong>! Sua doação para <strong>${eventoNome}</strong> foi confirmada. Obrigado!</p><p>Pedido: <strong>${inscricaoId.slice(0, 8).toUpperCase()}</strong></p>`
            : `<p>Olá, <strong>${recipientName}</strong>! Sua inscrição em <strong>${eventoNome}</strong> está garantida.</p><p>Pedido: <strong>${inscricaoId.slice(0, 8).toUpperCase()}</strong></p>`;
        }

        await sendEmail(inscricao.email, subject, body);
      }
    }

    if (canceledEvents.includes(eventType)) {
      await inscricaoRef.update({ status: isDonation ? 'cancelada' : 'cancelada' });
    }

    return res.status(200).send('ok');
  } catch (err: unknown) {
    console.error('Event payment webhook error:', (err as Error)?.message);
    return res.status(500).send('error');
  }
}
