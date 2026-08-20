import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, verifyAuth } from './_firebase.js';
import type { AuthError } from './_types.js';
import { createEventChargeSchema } from './_schemas.js';
import { validateBody } from './_validate.js';
import { decrypt } from './_gateway-utils.js';
import { createPaymentProvider } from './_payments/factory.js';
import type { GatewayType } from './_payments/types.js';

const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT = 15;

async function checkRateLimit(key: string): Promise<boolean> {
  const ref = db.collection('_rate_limits').doc(`eventCharge_${key}`);
  const snap = await ref.get();
  const now = Date.now();
  if (snap.exists) {
    const data = snap.data()!;
    const requests: number[] = (data.requests || []).filter((t: number) => now - t < RATE_WINDOW_MS);
    if (requests.length >= RATE_LIMIT) return false;
    requests.push(now);
    await ref.set({ requests });
  } else {
    await ref.set({ requests: [now] });
  }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const data = validateBody(req.body, res, createEventChargeSchema);
  if (!data) return;

  const {
    eventoId,
    inscricaoId,
    isDonation,
    paymentMethod,
    installments,
    attendeeName,
    attendeeEmail,
    attendeeCpf,
    attendeePhone,
    creditCard,
    valor,
  } = data;

  // Auth is optional — anonymous attendees can create charges
  let rateLimitKey: string;
  try {
    const decoded = await verifyAuth(req.headers.authorization);
    rateLimitKey = decoded.uid;
  } catch {
    rateLimitKey = `anon_${attendeeEmail}`;
  }

  const allowed = await checkRateLimit(rateLimitKey);
  if (!allowed) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
  }

  const encKey = process.env.GATEWAY_ENCRYPTION_KEY;
  if (!encKey) {
    return res.status(500).json({ error: 'Configuração de criptografia ausente.' });
  }

  try {
    // Busca o evento para descobrir o organizador
    const eventoDoc = await db.collection('eventos').doc(eventoId).get();
    if (!eventoDoc.exists) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }
    const evento = eventoDoc.data()!;
    const organizerId: string = evento.criado_por;

    // Verifica que a inscrição pertence a este evento
    const targetColl = isDonation ? 'doacoes' : 'inscricoes';
    const inscricaoSnap = await db.collection(`eventos/${eventoId}/${targetColl}`).doc(inscricaoId).get();
    if (!inscricaoSnap.exists) {
      return res.status(404).json({ error: 'Inscrição não encontrada neste evento.' });
    }
    const inscricaoData = inscricaoSnap.data()!;
    const alreadyPaid = isDonation ? inscricaoData.status === 'aprovada' : inscricaoData.status === 'pago';
    if (alreadyPaid) {
      return res.status(409).json({ error: 'Esta cobrança já foi processada.' });
    }

    // Busca o gateway do organizador
    const orgDoc = await db.collection('users').doc(organizerId).get();
    if (!orgDoc.exists) {
      return res.status(404).json({ error: 'Organizador não encontrado.' });
    }
    const orgData = orgDoc.data()!;

    if (!orgData.gateway?.encrypted_api_key) {
      return res.status(422).json({ error: 'Organizador não tem gateway configurado.' });
    }

    const apiKey = decrypt(orgData.gateway.encrypted_api_key, encKey);
    const sandbox: boolean = orgData.gateway.sandbox ?? false;
    const gatewayType: GatewayType = orgData.gateway.type ?? 'asaas';

    const provider = createPaymentProvider(gatewayType, apiKey, sandbox);

    let customerId: string;
    try {
      const customer = await provider.createCustomer({
        name: attendeeName,
        email: attendeeEmail,
        externalRef: `attendee:${inscricaoId}`,
        document: attendeeCpf,
      });
      customerId = customer.id;
    } catch (e: any) {
      console.error('[createEventCharge] createCustomer failed — status:', e?.response?.status ?? 'unknown');
      return res.status(500).json({ error: 'Erro ao criar cliente no gateway. Tente novamente.' });
    }

    // Data de vencimento: 3 dias a partir de hoje
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const holderInfo = creditCard
      ? {
          name: attendeeName,
          email: attendeeEmail,
          cpfCnpj: (attendeeCpf || '').replace(/\D/g, ''),
          phone: (attendeePhone || '').replace(/\D/g, ''),
        }
      : undefined;

    // ── Cobrança recorrente (assinatura mensal com maxPayments) ──────────────
    if (paymentMethod === 'recorrente') {
      if (!creditCard) {
        return res.status(400).json({ error: 'Dados do cartão são obrigatórios para cobrança recorrente.' });
      }
      const totalInstallments = Math.max(2, installments ?? 2);
      const installmentValue = parseFloat((valor / totalInstallments).toFixed(2));

      let subscription: { id: string; status: string };
      try {
        subscription = await provider.createSubscription({
          customerId,
          installmentValue,
          nextDueDate: dueDateStr,
          description: `Inscrição — ${evento.nome} (${totalInstallments}x recorrente)`,
          maxPayments: totalInstallments,
          externalRef: `event:${eventoId}:${inscricaoId}`,
          creditCard,
          cardHolder: holderInfo!,
        });
      } catch (e: any) {
        console.error('[createEventCharge] createSubscription failed — status:', e?.response?.status ?? 'unknown');
        return res.status(500).json({ error: 'Erro ao criar cobrança recorrente. Tente novamente.' });
      }

      const subColl = isDonation ? 'doacoes' : 'inscricoes';
      await db.collection(`eventos/${eventoId}/${subColl}`).doc(inscricaoId).update({
        ...(isDonation
          ? { formaPagamento: 'recorrente' }
          : { status: 'pagamento_iniciado', forma_pagamento: 'recorrente' }),
        gateway_subscription_id: subscription.id,
        installments: totalInstallments,
        installment_value: installmentValue,
      });

      return res.json({
        paymentUrl: null,
        pixQrCode: null,
        bankSlipUrl: null,
        identificationField: null,
        chargeId: subscription.id,
        installmentValue,
        installmentCount: totalInstallments,
      });
    }

    // ── Cobrança única / crédito parcelado ────────────────────────────────────
    let charge;
    try {
      charge = await provider.createCharge({
        customerId,
        value: valor,
        dueDate: dueDateStr,
        description: `Inscrição — ${evento.nome}`,
        paymentMethod: paymentMethod as any,
        installments,
        externalRef: `event:${eventoId}:${inscricaoId}`,
        creditCard,
        cardHolder: holderInfo,
      });
    } catch (e: any) {
      console.error('[createEventCharge] createCharge failed — status:', e?.response?.status ?? 'unknown');
      return res.status(500).json({ error: 'Erro ao criar cobrança. Tente novamente.' });
    }

    const chargeColl = isDonation ? 'doacoes' : 'inscricoes';
    await db.collection(`eventos/${eventoId}/${chargeColl}`).doc(inscricaoId).update({
      ...(isDonation
        ? { formaPagamento: paymentMethod }
        : { status: 'pagamento_iniciado', forma_pagamento: paymentMethod }),
      gateway_charge_id: charge.id,
      gateway_payment_url: charge.invoiceUrl,
    });

    return res.json({
      paymentUrl: charge.invoiceUrl,
      pixQrCode: charge.pixQrCode ?? null,
      bankSlipUrl: charge.bankSlipUrl ?? null,
      identificationField: charge.bankSlipBarcode ?? null,
      chargeId: charge.id,
      installmentValue: null,
      installmentCount: null,
    });
  } catch (err: unknown) {
    console.error('[createEventCharge] unexpected error:', err);
    return res.status(500).json({ error: 'Erro ao processar cobrança. Tente novamente.' });
  }
}
