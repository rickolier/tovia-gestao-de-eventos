// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { db } from './_firebase';

const ASAAS_BASE_URL = 'https://sandbox.asaas.com/api/v3';

const PLAN_PRICES: Record<string, number> = {
  essencial: 39.90,
  pro: 99.00,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { planLevel, userId, userName, userEmail, userCpfCnpj, userPhone, userCep, userEndereco, userNumero, userComplemento, userBairro } = req.body || {};

  if (!planLevel || !userId || !userEmail) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }

  // Plano gratuito — ativa direto no Firestore
  if (planLevel === 'start') {
    await db.collection('users').doc(userId).set(
      { plano: 'start', asaasSubscriptionId: null, planoPendente: null },
      { merge: true }
    );
    return res.json({ success: true, free: true });
  }

  const price = PLAN_PRICES[planLevel];
  if (!price) return res.status(400).json({ error: 'Plano inválido.' });

  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Configuração de pagamento ausente.' });

  const headers = { access_token: apiKey, 'Content-Type': 'application/json' };

  try {
    // 1. Buscar ou criar cliente no Asaas
    let customerId: string;
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? (userDoc.data() || {}) : {};

    if (userData.asaasCustomerId) {
      customerId = userData.asaasCustomerId;
    } else {
      const customerRes = await axios.post(
        `${ASAAS_BASE_URL}/customers`,
        {
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
        },
        { headers }
      );
      customerId = customerRes.data.id;
      await db.collection('users').doc(userId).set(
        { asaasCustomerId: customerId },
        { merge: true }
      );
    }

    // 2. Criar assinatura recorrente mensal
    let subscriptionId: string;
    try {
      const subscriptionRes = await axios.post(
        `${ASAAS_BASE_URL}/subscriptions`,
        {
          customer: customerId,
          billingType: 'UNDEFINED',
          value: price,
          nextDueDate: new Date().toISOString().split('T')[0],
          cycle: 'MONTHLY',
          description: `Tovia - Plano ${planLevel.charAt(0).toUpperCase() + planLevel.slice(1)}`,
          externalReference: `${userId}:${planLevel}`,
        },
        { headers }
      );
      subscriptionId = subscriptionRes.data.id;
    } catch (subErr: any) {
      console.error('Erro ao criar assinatura:', subErr?.response?.data || subErr.message);
      return res.status(500).json({ error: 'Erro ao criar assinatura no Asaas.' });
    }

    // 3. Buscar link de pagamento da primeira cobrança
    let paymentUrl: string | null = null;
    try {
      const paymentsRes = await axios.get(
        `${ASAAS_BASE_URL}/subscriptions/${subscriptionId}/payments`,
        { headers }
      );
      const firstPayment = paymentsRes.data.data?.[0];
      paymentUrl = firstPayment?.invoiceUrl || firstPayment?.bankSlipUrl || null;
    } catch (payErr: any) {
      console.error('Erro ao buscar pagamento:', payErr?.response?.data || payErr.message);
      // Assinatura criada mas link indisponível — salva mesmo assim para não perder o subscriptionId
    }

    // 4. Salvar no Firestore (sempre, mesmo sem paymentUrl)
    await db.collection('users').doc(userId).set(
      { asaasSubscriptionId: subscriptionId, planoPendente: planLevel },
      { merge: true }
    );

    if (!paymentUrl) {
      return res.status(500).json({ error: 'Assinatura criada, mas link de pagamento indisponível. Tente novamente em instantes.' });
    }

    return res.json({ paymentUrl, subscriptionId });
  } catch (err: any) {
    console.error('Asaas error:', err?.response?.data || err.message);
    return res.status(500).json({ error: 'Erro ao processar assinatura. Tente novamente.' });
  }
}
