// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import { db } from './_firebase';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'Tovia <noreply@tovia.app>';

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

  // Valida token do Asaas via SHA256 armazenado no organizer_public
  try {
    const eventoDoc = await db.collection('eventos').doc(eventoId).get();
    if (eventoDoc.exists) {
      const organizerId: string = eventoDoc.data()!.criado_por;
      const orgPublicDoc = await db.collection('organizer_public').doc(organizerId).get();
      if (orgPublicDoc.exists) {
        const storedHash: string = orgPublicDoc.data()!.webhook_token_hash ?? '';
        const incomingToken: string = String(req.headers['asaas-access-token'] ?? '');
        const incomingHash = createHash('sha256').update(incomingToken).digest('hex');
        if (storedHash && incomingHash !== storedHash) {
          console.warn(`[eventPaymentWebhook] token mismatch for evento ${eventoId}`);
          return res.status(401).send('Unauthorized');
        }
      }
    }
  } catch (e) {
    console.warn('[eventPaymentWebhook] token validation error (non-fatal):', e);
  }

  const paidEvents = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'];
  const canceledEvents = ['PAYMENT_OVERDUE', 'PAYMENT_DELETED', 'PAYMENT_REFUNDED'];

  try {
    const inscricaoRef = db.collection(`eventos/${eventoId}/inscricoes`).doc(inscricaoId);
    const inscricaoDoc = await inscricaoRef.get();
    if (!inscricaoDoc.exists) return res.status(200).send('ok');

    const inscricao = inscricaoDoc.data()!;

    if (paidEvents.includes(eventType)) {
      const dataPagamento = payment.paymentDate
        ? new Date(payment.paymentDate).toISOString()
        : new Date().toISOString();

      await inscricaoRef.update({
        status: 'pago',
        valor_pago: payment.value,
        data_pagamento: dataPagamento,
        validada_manual: true,
      });

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

      // E-mail de confirmação para o participante
      if (inscricao.email) {
        const eventoDoc = await db.collection('eventos').doc(eventoId).get();
        const eventoNome = eventoDoc.exists ? (eventoDoc.data()!.nome ?? 'evento') : 'evento';
        await sendEmail(
          inscricao.email,
          `Inscrição confirmada — ${eventoNome} ✅`,
          `<p>Olá, <strong>${inscricao.nome ?? ''}</strong>!</p>
           <p>Seu pagamento foi confirmado e sua inscrição no evento <strong>${eventoNome}</strong> está garantida.</p>
           <p>Número do pedido: <strong>${inscricaoId.slice(0, 8).toUpperCase()}</strong></p>
           <br><p>Até lá!<br><em>Equipe Tovia</em></p>`,
        );
      }
    }

    if (canceledEvents.includes(eventType)) {
      await inscricaoRef.update({ status: 'cancelada' });
    }

    return res.status(200).send('ok');
  } catch (err: any) {
    console.error('Event payment webhook error:', err?.message);
    return res.status(500).send('error');
  }
}
