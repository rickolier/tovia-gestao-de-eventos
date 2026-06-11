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

  const { planLevel, userId, userName, userEmail } = req.body as {
    planLevel: string;
    userId: string;
    userName: string;
    userEmail: string;
  };

  if (!planLevel || !userId || !userEmail) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }

  // Plano gratuito — ativa direto no Firestore
  if (planLevel === 'start') {
    await db.collection('users').doc(userId).update({ plano: 'start', asaasSubscriptionId: null, planoPendente: null });
    return res.json({ success: true, free: true });
  }

  const price = PLAN_PRICES[planLevel];
  if (!price) return res.status(400).json({ error: 'Plano inválido.' });

  const apiKey = process.env.ASAAS_API_KEY!;
  const headers = { access_token: apiKey, 'Content-Type': 'application/json' };

  try {
    // 1. Buscar ou criar cliente no Asaas
    let customerId: string;
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data() || {};

    if (userData.asaasCustomerId) {
      customerId = userData.asaasCustomerId;
    } else {
      const customerRes = await axios.post(
        `${ASAAS_BASE_URL}/customers`,
        { name: userName || userEmail, email: userEmail, externalReference: userId },
        { headers }
      );
      customerId = customerRes.data.id;
      await db.collection('users').doc(userId).update({ asaasCustomerId: customerId });
    }

    // 2. Criar assinatura recorrente mensal
    const subscriptionRes = await axios.post(
      `${ASAAS_BASE_URL}/subscriptions`,
      {
        customer: customerId,
        billingType: 'UNDEFINED',
        value: price,
        nextDueDate: new Date().toISOString().split('T')[0],
        cycle: 'MONTHLY',
        description: `Ekko - Plano ${planLevel.charAt(0).toUpperCase() + planLevel.slice(1)}`,
        externalReference: `${userId}:${planLevel}`,
      },
      { headers }
    );

    const subscriptionId = subscriptionRes.data.id;

    // 3. Buscar link de pagamento da primeira cobrança
    const paymentsRes = await axios.get(
      `${ASAAS_BASE_URL}/subscriptions/${subscriptionId}/payments`,
      { headers }
    );
    const firstPayment = paymentsRes.data.data?.[0];
    const paymentUrl = firstPayment?.invoiceUrl || firstPayment?.bankSlipUrl;

    if (!paymentUrl) {
      return res.status(500).json({ error: 'Não foi possível gerar o link de pagamento.' });
    }

    // 4. Salvar subscriptionId pendente no Firestore
    await db.collection('users').doc(userId).update({
      asaasSubscriptionId: subscriptionId,
      planoPendente: planLevel,
    });

    return res.json({ paymentUrl, subscriptionId });
  } catch (err: any) {
    console.error('Asaas error:', err?.response?.data || err.message);
    return res.status(500).json({ error: 'Erro ao criar assinatura. Tente novamente.' });
  }
}
