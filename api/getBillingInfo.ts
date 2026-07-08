// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { db, verifyAuth } from './_firebase.js';

const ASAAS_SANDBOX_URL    = 'https://sandbox.asaas.com/api/v3';
const ASAAS_PRODUCTION_URL = 'https://api.asaas.com/api/v3';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId obrigatório.' });

  try {
    await verifyAuth(req.headers.authorization, userId);
  } catch (e: any) {
    return res.status(e.status ?? 401).json({ error: e.message });
  }

  let apiKey: string;
  let ASAAS_BASE_URL: string;
  try {
    const billingDoc = await db.collection('config').doc('billing').get();
    const billing = billingDoc.exists ? billingDoc.data() : null;
    apiKey = billing?.asaas_api_key?.trim() || process.env.ASAAS_API_KEY?.trim() || '';
    const isSandbox = billing ? billing.sandbox !== false : true;
    ASAAS_BASE_URL = isSandbox ? ASAAS_SANDBOX_URL : ASAAS_PRODUCTION_URL;
  } catch {
    apiKey = process.env.ASAAS_API_KEY?.trim() || '';
    ASAAS_BASE_URL = ASAAS_SANDBOX_URL;
  }

  if (!apiKey) return res.status(500).json({ error: 'Configuração de pagamento ausente.' });

  const headers = { access_token: apiKey, 'Content-Type': 'application/json' };

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const userData = userDoc.data();
    if (!userData) return res.status(404).json({ error: 'Dados do usuário ausentes.' });

    const { asaasSubscriptionId, asaasCustomerId, plano } = userData;

    if (!asaasSubscriptionId || !asaasCustomerId) {
      return res.json({ hasSubscription: false, plano: plano || null });
    }

    const [subscriptionRes, paymentsRes, customerRes] = await Promise.all([
      axios.get(`${ASAAS_BASE_URL}/subscriptions/${asaasSubscriptionId}`, { headers }),
      axios.get(`${ASAAS_BASE_URL}/subscriptions/${asaasSubscriptionId}/payments?limit=12`, { headers }),
      axios.get(`${ASAAS_BASE_URL}/customers/${asaasCustomerId}`, { headers }),
    ]);

    const subscription = subscriptionRes.data;
    const payments: any[] = paymentsRes.data.data || [];
    const customer = customerRes.data;

    const lastPaid = payments.find((p: any) => p.status === 'RECEIVED' || p.status === 'CONFIRMED');
    const creditCard = lastPaid?.creditCard || null;

    return res.json({
      hasSubscription: true,
      plano,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        value: subscription.value,
        cycle: subscription.cycle,
        nextDueDate: subscription.nextDueDate,
        billingType: subscription.billingType,
        description: subscription.description,
      },
      customer: {
        name: customer.name,
        email: customer.email,
        cpfCnpj: customer.cpfCnpj || null,
      },
      creditCard,
      payments: payments.map((p: any) => ({
        id: p.id,
        status: p.status,
        value: p.value,
        dueDate: p.dueDate,
        paymentDate: p.paymentDate || null,
        invoiceUrl: p.invoiceUrl || null,
        billingType: p.billingType,
      })),
    });
  } catch (err: any) {
    console.error('getBillingInfo error:', err?.response?.data || err.message);
    return res.status(500).json({ error: 'Erro ao buscar dados de faturamento.' });
  }
}
