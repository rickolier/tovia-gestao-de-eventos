// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { db, verifyAuth } from './_firebase.js';

const ASAAS_BASE_URL = 'https://sandbox.asaas.com/api/v3';

const MONTHLY_PRICES: Record<string, number> = {
  petach: 39,
  koach: 99,
  chalem: 249,
};

const ANNUAL_PRICES: Record<string, number> = {
  petach: 390,
  koach: 990,
  chalem: 2490,
};

const PLAN_LABEL: Record<string, string> = {
  petach: 'Plano 2 - Pétach',
  koach:  'Plano 3 - Koách',
  chalem: 'Plano 4 - Chalém',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    planLevel,
    period = 'monthly',
    paymentMethod = 'credit_card',
    userId,
    userName,
    userEmail,
    userCpfCnpj,
    userPhone,
    userCep,
    userEndereco,
    userNumero,
    userComplemento,
    userBairro,
  } = req.body || {};

  if (!planLevel || !userId || !userEmail) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }

  if (!['petach', 'koach', 'chalem'].includes(planLevel)) {
    return res.status(400).json({ error: 'Plano inválido.' });
  }

  if (!['monthly', 'annual'].includes(period)) {
    return res.status(400).json({ error: 'Período inválido.' });
  }

  try {
    await verifyAuth(req.headers.authorization, userId);
  } catch (e: any) {
    return res.status(e.status ?? 401).json({ error: e.message });
  }

  const price = period === 'annual' ? ANNUAL_PRICES[planLevel] : MONTHLY_PRICES[planLevel];
  if (!price) return res.status(400).json({ error: 'Preço não encontrado.' });

  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Configuração de pagamento ausente.' });

  const headers = { access_token: apiKey, 'Content-Type': 'application/json' };

  try {
    // 1. Buscar ou criar cliente no Asaas
    let customerId: string;
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? (userDoc.data() || {}) : {};

    const customerPayload = {
      name: userName || userEmail,
      email: userEmail,
      externalReference: userId,
      ...(userCpfCnpj ? { cpfCnpj: userCpfCnpj.replace(/\D/g, '') } : {}),
      ...(userPhone ? { mobilePhone: userPhone.replace(/\D/g, '') } : {}),
      ...(userCep ? { postalCode: userCep.replace(/\D/g, '') } : {}),
      ...(userEndereco ? { address: userEndereco } : {}),
      ...(userNumero ? { addressNumber: userNumero } : {}),
      ...(userComplemento ? { complement: userComplemento } : {}),
      ...(userBairro ? { province: userBairro } : {}),
    };

    if (userData.asaasCustomerId) {
      customerId = userData.asaasCustomerId;
      if (userCpfCnpj) {
        try {
          await axios.put(`${ASAAS_BASE_URL}/customers/${customerId}`, customerPayload, { headers });
        } catch {
          const newCustomerRes = await axios.post(`${ASAAS_BASE_URL}/customers`, customerPayload, { headers });
          customerId = newCustomerRes.data.id;
          await db.collection('users').doc(userId).set({ asaasCustomerId: customerId }, { merge: true });
        }
      }
    } else {
      const customerRes = await axios.post(`${ASAAS_BASE_URL}/customers`, customerPayload, { headers });
      customerId = customerRes.data.id;
      await db.collection('users').doc(userId).set({ asaasCustomerId: customerId }, { merge: true });
    }

    const description = `Tovia · ${PLAN_LABEL[planLevel]} · ${period === 'annual' ? 'Anual' : 'Mensal'}`;

    if (period === 'monthly') {
      // Assinatura recorrente mensal com cartão de crédito
      let subscriptionId: string;
      try {
        const subscriptionRes = await axios.post(
          `${ASAAS_BASE_URL}/subscriptions`,
          {
            customer: customerId,
            billingType: 'CREDIT_CARD',
            value: price,
            nextDueDate: new Date().toISOString().split('T')[0],
            cycle: 'MONTHLY',
            description,
            externalReference: `${userId}:${planLevel}:monthly`,
          },
          { headers }
        );
        subscriptionId = subscriptionRes.data.id;
      } catch (subErr: any) {
        console.error('Erro ao criar assinatura no Asaas.', subErr?.response?.status);
        return res.status(500).json({ error: 'Erro ao criar assinatura no Asaas.' });
      }

      // Buscar link da primeira cobrança
      let paymentUrl: string | null = null;
      try {
        const paymentsRes = await axios.get(
          `${ASAAS_BASE_URL}/subscriptions/${subscriptionId}/payments`,
          { headers }
        );
        const firstPayment = paymentsRes.data.data?.[0];
        paymentUrl = firstPayment?.invoiceUrl || firstPayment?.bankSlipUrl || null;
      } catch {
        // Assinatura criada, link indisponível
      }

      await db.collection('users').doc(userId).set(
        {
          asaasSubscriptionId: subscriptionId,
          planoPendente: planLevel,
          subscriptionPeriod: 'monthly',
        },
        { merge: true }
      );

      if (!paymentUrl) {
        return res.status(500).json({ error: 'Assinatura criada, mas link de pagamento indisponível. Tente novamente em instantes.' });
      }

      return res.json({ paymentUrl, subscriptionId });
    }

    // Plano anual — pagamento único (cartão 12x ou PIX à vista)
    const effectivePaymentMethod = paymentMethod === 'pix' ? 'pix' : 'credit_card';
    const billingType = effectivePaymentMethod === 'pix' ? 'PIX' : 'CREDIT_CARD';

    let paymentId: string;
    let paymentUrl: string | null = null;
    try {
      const paymentPayload: any = {
        customer: customerId,
        billingType,
        value: price,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description,
        externalReference: `${userId}:${planLevel}:annual:${effectivePaymentMethod}`,
      };

      if (effectivePaymentMethod === 'credit_card') {
        paymentPayload.installmentCount = 12;
        paymentPayload.installmentValue = +(price / 12).toFixed(2);
      }

      const paymentRes = await axios.post(`${ASAAS_BASE_URL}/payments`, paymentPayload, { headers });
      paymentId = paymentRes.data.id;
      paymentUrl = paymentRes.data.invoiceUrl || paymentRes.data.bankSlipUrl || null;
    } catch (payErr: any) {
      console.error('Erro ao criar pagamento anual no Asaas.', payErr?.response?.status);
      return res.status(500).json({ error: 'Erro ao criar pagamento no Asaas.' });
    }

    const annualExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    await db.collection('users').doc(userId).set(
      {
        planoPendente: planLevel,
        subscriptionPeriod: 'annual',
        subscriptionExpiresAt: annualExpiresAt,
        asaasSubscriptionId: paymentId,
      },
      { merge: true }
    );

    if (!paymentUrl) {
      return res.status(500).json({ error: 'Pagamento criado, mas link indisponível. Tente novamente em instantes.' });
    }

    return res.json({ paymentUrl, paymentId });
  } catch (err: any) {
    console.error('Asaas error.', err?.response?.status);
    return res.status(500).json({ error: 'Erro ao processar pagamento. Tente novamente.' });
  }
}
