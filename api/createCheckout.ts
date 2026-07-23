import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { db, verifyAuth } from './_firebase.js';
import type { AuthError } from './types.js';
import { checkoutSchema } from './schemas.js';
import { validateBody } from './validate.js';

const CHECKOUT_RATE_WINDOW_MS = 10 * 60 * 1000;
const CHECKOUT_RATE_LIMIT = 3;

async function checkCheckoutRateLimit(uid: string): Promise<boolean> {
  const key = `checkout_${uid}`;
  const ref = db.collection('_rate_limits').doc(key);
  const snap = await ref.get();
  const now = Date.now();
  if (snap.exists) {
    const data = snap.data()!;
    const requests: number[] = (data.requests || []).filter((t: number) => now - t < CHECKOUT_RATE_WINDOW_MS);
    if (requests.length >= CHECKOUT_RATE_LIMIT) return false;
    requests.push(now);
    await ref.set({ requests });
  } else {
    await ref.set({ requests: [now] });
  }
  return true;
}

const ASAAS_SANDBOX_URL    = 'https://sandbox.asaas.com/api/v3';
const ASAAS_PRODUCTION_URL = 'https://api.asaas.com/api/v3';

const MONTHLY_PRICES: Record<string, number> = {
  petach: 49,
  koach: 129,
  chalem: 299,
};

const ANNUAL_PRICES: Record<string, number> = {
  petach: 490,
  koach: 1290,
  chalem: 2990,
};

const PLAN_LABEL: Record<string, string> = {
  petach: 'Plano 2 - Pétach',
  koach:  'Plano 3 - Koách',
  chalem: 'Plano 4 - Chalém',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const data = validateBody(req.body, res, checkoutSchema);
  if (!data) return;

  const {
    planLevel,
    period,
    paymentMethod,
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
  } = data;

  try {
    await verifyAuth(req.headers.authorization, userId);
  } catch (e: unknown) {
    const authErr = e as AuthError;
    return res.status(authErr.status ?? 401).json({ error: authErr.message });
  }

  const checkoutAllowed = await checkCheckoutRateLimit(userId);
  if (!checkoutAllowed) {
    return res.status(429).json({ error: 'Muitas tentativas de pagamento. Aguarde alguns minutos.' });
  }

  const price = period === 'annual' ? ANNUAL_PRICES[planLevel] : MONTHLY_PRICES[planLevel];
  if (!price) return res.status(400).json({ error: 'Preço não encontrado.' });

  // Lê chave e ambiente do Firestore (config/billing), com fallback para env var
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

  if (!apiKey) return res.status(500).json({ error: 'Configuração de pagamento ausente. Configure a chave Asaas no painel admin.' });

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

    // Busca ou cria cliente no Asaas
    // Estratégia: (1) asaasCustomerId salvo → atualiza; (2) busca por cpfCnpj; (3) cria novo
    const resolveCustomer = async (): Promise<string> => {
      const cpfCnpjClean = userCpfCnpj ? userCpfCnpj.replace(/\D/g, '') : '';

      // Temos ID salvo — atualiza e retorna
      if (userData.asaasCustomerId) {
        try {
          await axios.put(`${ASAAS_BASE_URL}/customers/${userData.asaasCustomerId}`, customerPayload, { headers });
          return userData.asaasCustomerId;
        } catch {
          // ID salvo pode estar obsoleto, tenta buscar/criar abaixo
        }
      }

      // Busca por cpfCnpj para evitar duplicata
      if (cpfCnpjClean) {
        try {
          const searchRes = await axios.get(
            `${ASAAS_BASE_URL}/customers?cpfCnpj=${cpfCnpjClean}`,
            { headers }
          );
          const existing = searchRes.data?.data?.[0];
          if (existing?.id) {
            // Atualiza o cadastro existente e salva o ID
            try {
              await axios.put(`${ASAAS_BASE_URL}/customers/${existing.id}`, customerPayload, { headers });
            } catch { /* atualização não crítica */ }
            await db.collection('users').doc(userId).set({ asaasCustomerId: existing.id }, { merge: true });
            return existing.id;
          }
        } catch { /* busca falhou, tenta criar */ }
      }

      // Cria novo cliente
      try {
        const createRes = await axios.post(`${ASAAS_BASE_URL}/customers`, customerPayload, { headers });
        const newId = createRes.data.id;
        await db.collection('users').doc(userId).set({ asaasCustomerId: newId }, { merge: true });
        return newId;
      } catch (custErr: unknown) {
        const ce = custErr as { response?: { data?: { errors?: Array<{ description?: string; code?: string }> } }; message?: string };
        const asaasErrors = ce?.response?.data?.errors;
        const detail = Array.isArray(asaasErrors)
          ? asaasErrors.map((e) => e.description || e.code).join('; ')
          : JSON.stringify(ce?.response?.data ?? ce?.message);
        console.error('Erro ao criar cliente Asaas:', detail);
        throw new Error(`Erro ao registrar cliente no Asaas: ${detail}`);
      }
    };

    try {
      customerId = await resolveCustomer();
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao criar cliente no Asaas.' });
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
      } catch (subErr: unknown) {
        const e = subErr as { response?: { data?: unknown } };
        console.error('Erro ao criar assinatura no Asaas:', JSON.stringify(e?.response?.data));
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
          plano: planLevel,
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
      const paymentPayload: Record<string, unknown> = {
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
    } catch (payErr: unknown) {
      const e = payErr as { response?: { status?: number } };
      console.error('Erro ao criar pagamento anual no Asaas.', e?.response?.status);
      return res.status(500).json({ error: 'Erro ao criar pagamento no Asaas.' });
    }

    const annualExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    await db.collection('users').doc(userId).set(
      {
        plano: planLevel,
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
  } catch (err: unknown) {
    const e = err as { response?: { status?: number } };
    console.error('Asaas error.', e?.response?.status);
    return res.status(500).json({ error: 'Erro ao processar pagamento. Tente novamente.' });
  }
}
